// Dashboard JavaScript
const API_BASE = '/api';
let currentClassroomId = null;
let trendChart = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  setInterval(refreshData, 60000); // Refresh every minute
});

async function loadDashboard() {
  try {
    // For demo purposes, use a hardcoded classroom ID
    // In production, get from user session/auth
    const classroomId = localStorage.getItem('selectedClassroom') || 'demo-classroom-id';
    currentClassroomId = classroomId;

    await loadClassroomData(classroomId);
    await loadTrendChart(classroomId);
  } catch (error) {
    console.error('Dashboard load error:', error);
    showError('Failed to load dashboard data');
  }
}

async function loadClassroomData(classroomId) {
  try {
    const response = await fetch(`${API_BASE}/dashboard/classroom/${classroomId}`);
    const data = await response.json();

    if (data.success) {
      updateStats(data.today);
      updateAlerts(data.lowScoreAlerts);
    }
  } catch (error) {
    console.error('Error loading classroom data:', error);
  }
}

function updateStats(stats) {
  document.getElementById('totalCheckins').textContent = stats.total_checkins || 0;
  document.getElementById('averageScore').textContent = stats.average_score
    ? Math.round(stats.average_score) + '/100'
    : 'N/A';
  document.getElementById('lowScores').textContent = stats.low_scores || 0;
  document.getElementById('alertsSent').textContent = stats.alerts_sent || 0;
}

function updateAlerts(alerts) {
  const alertsList = document.getElementById('alertsList');

  if (!alerts || alerts.length === 0) {
    alertsList.innerHTML = '<p class="loading">No alerts today 🎉</p>';
    return;
  }

  alertsList.innerHTML = alerts.map(alert => {
    const isCritical = alert.wellbeing_score < 30;
    const symptoms = alert.symptoms && alert.symptoms.length > 0
      ? alert.symptoms.join(', ')
      : 'None';

    return `
      <div class="alert-item ${isCritical ? 'critical' : ''}">
        <div class="alert-info">
          <strong>${alert.first_name || 'Student'} (Age ${alert.age})</strong>
          <div>Mood: ${getMoodLabel(alert.mood)} | Symptoms: ${symptoms}</div>
          <div class="alert-time">${new Date(alert.timestamp).toLocaleString()}</div>
          ${alert.alert_sent ? '<span style="color: green;">✓ Alert sent</span>' : ''}
        </div>
        <div class="alert-score">${alert.wellbeing_score}</div>
      </div>
    `;
  }).join('');
}

function getMoodLabel(mood) {
  const labels = ['Very sad 😢', 'Sad 😞', 'Okay 😐', 'Good 🙂', 'Happy 😊', 'Very happy 😄'];
  return labels[mood] || 'Unknown';
}

async function loadTrendChart(classroomId) {
  try {
    const response = await fetch(`${API_BASE}/dashboard/classroom/${classroomId}`);
    const data = await response.json();

    if (data.success && data.trend) {
      const ctx = document.getElementById('trendChart').getContext('2d');

      if (trendChart) {
        trendChart.destroy();
      }

      trendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.trend.map(d => new Date(d.date).toLocaleDateString()),
          datasets: [
            {
              label: 'Average Well-being Score',
              data: data.trend.map(d => Math.round(d.avg_score)),
              borderColor: '#4a90e2',
              backgroundColor: 'rgba(74, 144, 226, 0.1)',
              tension: 0.3,
              fill: true,
            },
            {
              label: 'Average Mood',
              data: data.trend.map(d => d.avg_mood * 20), // Scale to 100
              borderColor: '#f39c12',
              backgroundColor: 'rgba(243, 156, 18, 0.1)',
              tension: 0.3,
              fill: true,
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: false,
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Score (0-100)'
              }
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading trend chart:', error);
  }
}

async function generateQRCode() {
  if (!currentClassroomId) {
    alert('Please select a classroom first');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/qrcode/generate/${currentClassroomId}`);
    const data = await response.json();

    if (data.success) {
      document.getElementById('qrCodeImage').src = data.qrCodeDataURL;
      document.getElementById('qrCodeLabel').textContent =
        `QR Code for ${data.classroomName}`;
      document.getElementById('qrCodeSection').style.display = 'block';
    }
  } catch (error) {
    console.error('QR generation error:', error);
    alert('Failed to generate QR code');
  }
}

function printQRCode() {
  const qrImage = document.getElementById('qrCodeImage');
  const label = document.getElementById('qrCodeLabel').textContent;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Print QR Code</title>
        <style>
          body { text-align: center; font-family: Arial, sans-serif; padding: 40px; }
          img { max-width: 500px; margin: 20px 0; }
          h1 { color: #4a90e2; }
          .instructions { margin-top: 30px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${label}</h1>
        <img src="${qrImage.src}" alt="QR Code">
        <div class="instructions">
          <p><strong>Instructions for Students:</strong></p>
          <ol style="text-align: left; display: inline-block;">
            <li>Open the Well-being Check-in app on your phone</li>
            <li>Tap "Start Check-in"</li>
            <li>Scan this QR code</li>
            <li>Answer the questions honestly</li>
          </ol>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function changeClassroom() {
  const select = document.getElementById('classroomSelect');
  const classroomId = select.value;

  if (classroomId) {
    localStorage.setItem('selectedClassroom', classroomId);
    currentClassroomId = classroomId;
    loadDashboard();
  }
}

function refreshData() {
  if (currentClassroomId) {
    loadClassroomData(currentClassroomId);
  }
}

function logout() {
  localStorage.clear();
  window.location.href = '/login.html';
}

function showError(message) {
  alert(message);
}
