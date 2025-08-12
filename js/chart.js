// 图表实例
let trendChart, subjectChart;

// 初始化图表
function initCharts() {
    // 趋势图表（初始为空）
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '平均分',
                data: [],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#4361ee',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: 10,
                    titleFont: { size: 12 },
                    bodyFont: { size: 12 }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 60,
                    max: 100,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        callback: function(value) {
                            return value + '分';
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 0, autoSkip: true }
                }
            }
        }
    });
    
    // 科目对比图表（初始为空）
    const subjectCtx = document.getElementById('subjectChart').getContext('2d');
    subjectChart = new Chart(subjectCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '我的成绩',
                data: [],
                backgroundColor: '#4895ef',
                borderColor: '#3f37c9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: 10
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        callback: function(value) {
                            return value + '分';
                        }
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// 更新图表
function updateCharts(student) {
    if (!student || !student.subjects) return;
    
    // 更新科目对比图表
    if (subjectChart) {
        subjectChart.data.labels = student.subjects.map(s => s.name);
        subjectChart.data.datasets[0].data = student.subjects.map(s => s.score);
        subjectChart.update();
    }
    
    // 更新趋势图表（使用历史数据）
    if (trendChart) {
        // 加载历史数据
        if (!historicalDataCache) {
            fetch('data/historical-data.json')
                .then(response => response.json())
                .then(data => {
                    historicalDataCache = data;
                    updateTrendChart(data);
                })
                .catch(error => {
                    console.error('加载历史数据失败:', error);
                });
        } else {
            updateTrendChart(historicalDataCache);
        }
    }
}

// 更新趋势图表
function updateTrendChart(historicalData) {
    if (trendChart && historicalData && historicalData.length > 0) {
        const semesterLabels = historicalData.map(d => d.semester);
        const averageScores = historicalData.map(d => d.average);
        
        trendChart.data.labels = semesterLabels;
        trendChart.data.datasets[0].data = averageScores;
        trendChart.update();
    }
}