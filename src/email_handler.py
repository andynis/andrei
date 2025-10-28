"""
Email Handler Module
Connects to email inbox and retrieves press releases with attachments
"""

import imaplib
import email
from email.header import decode_header
import os
import json
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class EmailHandler:
    """Handles email inbox connection and press release retrieval"""

    def __init__(
        self,
        host: str,
        port: int,
        username: str,
        password: str,
        folder: str = "INBOX",
        temp_dir: str = "./temp",
        processed_log: str = "./processed_emails.json"
    ):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.folder = folder
        self.temp_dir = temp_dir
        self.processed_log = processed_log
        self.mail = None

        # Create temp directory if it doesn't exist
        os.makedirs(self.temp_dir, exist_ok=True)

        # Load processed emails log
        self.processed_emails = self._load_processed_log()

    def _load_processed_log(self) -> set:
        """Load list of already processed email IDs"""
        if os.path.exists(self.processed_log):
            try:
                with open(self.processed_log, 'r') as f:
                    data = json.load(f)
                    return set(data.get('processed_ids', []))
            except Exception as e:
                logger.warning(f"Could not load processed log: {e}")
                return set()
        return set()

    def _save_processed_log(self):
        """Save processed email IDs to log file"""
        try:
            with open(self.processed_log, 'w') as f:
                json.dump({
                    'processed_ids': list(self.processed_emails),
                    'last_updated': datetime.now().isoformat()
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save processed log: {e}")

    def connect(self):
        """Connect to email server"""
        try:
            logger.info(f"Connecting to {self.host}:{self.port}")
            self.mail = imaplib.IMAP4_SSL(self.host, self.port)
            self.mail.login(self.username, self.password)
            self.mail.select(self.folder)
            logger.info("Successfully connected to email inbox")
        except Exception as e:
            logger.error(f"Failed to connect to email: {e}")
            raise

    def disconnect(self):
        """Disconnect from email server"""
        if self.mail:
            try:
                self.mail.close()
                self.mail.logout()
                logger.info("Disconnected from email inbox")
            except Exception as e:
                logger.warning(f"Error during disconnect: {e}")

    def search_emails(self, subject_filters: List[str] = None) -> List[str]:
        """Search for unread emails matching filters"""
        try:
            # Search for unseen emails
            status, messages = self.mail.search(None, 'UNSEEN')

            if status != 'OK':
                logger.warning("No new emails found")
                return []

            email_ids = messages[0].split()
            logger.info(f"Found {len(email_ids)} unread emails")

            if subject_filters:
                filtered_ids = []
                for email_id in email_ids:
                    if self._matches_subject_filter(email_id, subject_filters):
                        filtered_ids.append(email_id)
                logger.info(f"Filtered to {len(filtered_ids)} emails matching criteria")
                return [eid.decode() for eid in filtered_ids]

            return [eid.decode() for eid in email_ids]

        except Exception as e:
            logger.error(f"Error searching emails: {e}")
            return []

    def _matches_subject_filter(self, email_id: bytes, filters: List[str]) -> bool:
        """Check if email subject matches any filter"""
        try:
            status, msg_data = self.mail.fetch(email_id, '(RFC822)')
            if status != 'OK':
                return False

            email_body = msg_data[0][1]
            message = email.message_from_bytes(email_body)
            subject = self._decode_header(message['Subject'])

            return any(f.lower() in subject.lower() for f in filters)

        except Exception as e:
            logger.error(f"Error checking subject filter: {e}")
            return False

    def retrieve_email(self, email_id: str) -> Optional[Dict]:
        """Retrieve email content and attachments"""
        try:
            # Check if already processed
            if email_id in self.processed_emails:
                logger.info(f"Email {email_id} already processed, skipping")
                return None

            status, msg_data = self.mail.fetch(email_id.encode(), '(RFC822)')
            if status != 'OK':
                logger.error(f"Failed to fetch email {email_id}")
                return None

            email_body = msg_data[0][1]
            message = email.message_from_bytes(email_body)

            # Extract email metadata
            subject = self._decode_header(message['Subject'])
            from_addr = self._decode_header(message['From'])
            date = message['Date']

            logger.info(f"Processing email: {subject}")

            # Extract body and attachments
            body_text = self._extract_body(message)
            attachments = self._extract_attachments(message, email_id)

            email_data = {
                'id': email_id,
                'subject': subject,
                'from': from_addr,
                'date': date,
                'body': body_text,
                'attachments': attachments,
                'retrieved_at': datetime.now().isoformat()
            }

            # Mark as processed
            self.processed_emails.add(email_id)
            self._save_processed_log()

            return email_data

        except Exception as e:
            logger.error(f"Error retrieving email {email_id}: {e}")
            return None

    def _decode_header(self, header: str) -> str:
        """Decode email header"""
        if header is None:
            return ""

        decoded_parts = decode_header(header)
        decoded_string = ""

        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                try:
                    decoded_string += part.decode(encoding or 'utf-8')
                except Exception:
                    decoded_string += part.decode('utf-8', errors='ignore')
            else:
                decoded_string += part

        return decoded_string

    def _extract_body(self, message: email.message.Message) -> str:
        """Extract email body text"""
        body = ""

        if message.is_multipart():
            for part in message.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))

                # Get text/plain parts
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    try:
                        payload = part.get_payload(decode=True)
                        charset = part.get_content_charset() or 'utf-8'
                        body += payload.decode(charset, errors='ignore')
                    except Exception as e:
                        logger.warning(f"Could not decode email body: {e}")
        else:
            try:
                payload = message.get_payload(decode=True)
                charset = message.get_content_charset() or 'utf-8'
                body = payload.decode(charset, errors='ignore')
            except Exception as e:
                logger.warning(f"Could not decode email body: {e}")

        return body.strip()

    def _extract_attachments(self, message: email.message.Message, email_id: str) -> List[Dict]:
        """Extract and save attachments"""
        attachments = []

        for part in message.walk():
            if part.get_content_disposition() == 'attachment':
                filename = part.get_filename()
                if filename:
                    filename = self._decode_header(filename)

                    # Check if supported format
                    ext = os.path.splitext(filename)[1].lower()
                    if ext not in ['.pdf', '.doc', '.docx', '.txt']:
                        logger.info(f"Skipping unsupported attachment: {filename}")
                        continue

                    # Save attachment
                    filepath = os.path.join(self.temp_dir, f"{email_id}_{filename}")

                    try:
                        with open(filepath, 'wb') as f:
                            f.write(part.get_payload(decode=True))

                        attachments.append({
                            'filename': filename,
                            'filepath': filepath,
                            'size': os.path.getsize(filepath),
                            'type': ext[1:]  # Remove dot
                        })

                        logger.info(f"Saved attachment: {filename}")

                    except Exception as e:
                        logger.error(f"Error saving attachment {filename}: {e}")

        return attachments

    def mark_as_read(self, email_id: str):
        """Mark email as read"""
        try:
            self.mail.store(email_id.encode(), '+FLAGS', '\\Seen')
            logger.debug(f"Marked email {email_id} as read")
        except Exception as e:
            logger.error(f"Error marking email as read: {e}")

    def cleanup_temp_files(self, email_data: Dict):
        """Clean up temporary attachment files"""
        try:
            for attachment in email_data.get('attachments', []):
                filepath = attachment.get('filepath')
                if filepath and os.path.exists(filepath):
                    os.remove(filepath)
                    logger.debug(f"Deleted temp file: {filepath}")
        except Exception as e:
            logger.error(f"Error cleaning up temp files: {e}")
