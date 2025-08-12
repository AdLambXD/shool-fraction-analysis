// 确保图表实例在全局作用域可用
window.trendChart = null;
window.subjectChart = null;

// 初始化图表
function initCharts() {
    // 趋势图表（初始为空）
    const trendCtx = document.getElementById('trendChart')?.getContext('2d');
    if (trendCtx) {
        window.trendChart = new Chart(trendCtx, {
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
    }
    
    // 科目对比图表（初始为空）
    const subjectCtx = document.getElementById('subjectChart')?.getContext('2d');
    if (subjectCtx) {
        window.subjectChart = new Chart(subjectCtx, {
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
}

// 更新图表
function updateCharts(student) {
    if (!student || !student.subjects) return;
    
    // 更新科目对比图表
    if (window.subjectChart) {
        window.subjectChart.data.labels = student.subjects.map(s => s.name);
        window.subjectChart.data.datasets[0].data = student.subjects.map(s => s.score);
        window.subjectChart.update();
    }
    
    // 更新趋势图表（这里需要历史数据）
    if (window.trendChart) {
        // 模拟历史数据
        const semesterLabels = ['2020-2021第二', '2021-2022第一', '2021-2022第二', '2022-2023第一', '2022-2023第二', '2023-2024第一'];
        const averageScores = [79.8, 80.5, 82.9, 83.7, 85.2, 87.4];
        
        window.trendChart.data.labels = semesterLabels;
        window.trendChart.data.datasets[0].data = averageScores;
        window.trendChart.update();
    }
}

// 初始化图表
document.addEventListener('DOMContentLoaded', initCharts);