// 图表实例
let trendChart, subjectChart;

// 当前选中的考试、班级和学生
let currentExam = null;
let currentClass = null;
let currentStudent = null;

// 从远程加载考试列表
async function loadExams() {
    try {
        const response = await fetch('data/exams.json');
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        return await response.json();
    } catch (error) {
        console.error('加载考试列表失败:', error);
        return null;
    }
}

// 加载考试数据
async function loadExamData(examId) {
    try {
        const response = await fetch(`data/exam_${examId}.json`);
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        return await response.json();
    } catch (error) {
        console.error('加载考试数据失败:', error);
        return null;
    }
}

// 初始化应用
async function initApp() {
    const exams = await loadExams();
    
    if (!exams) {
        alert('无法加载考试列表，请稍后再试');
        return;
    }
    
    // 填充考试选择器
    const examSelect = document.getElementById('examSelect');
    examSelect.innerHTML = '';
    
    exams.forEach(exam => {
        const option = document.createElement('option');
        option.value = exam.id;
        option.textContent = exam.name;
        examSelect.appendChild(option);
    });
    
    // 添加考试切换事件
    examSelect.addEventListener('change', async function() {
        if (!this.value) return;
        
        // 重置班级和学生选择器
        const classSelect = document.getElementById('classSelect');
        classSelect.innerHTML = '<option value="">加载班级中...</option>';
        classSelect.disabled = true;
        
        const studentSelect = document.getElementById('studentSelect');
        studentSelect.innerHTML = '<option value="">请先选择班级</option>';
        studentSelect.disabled = true;
        
        // 加载考试数据
        const examData = await loadExamData(this.value);
        if (!examData) {
            alert('无法加载考试数据');
            return;
        }
        
        currentExam = examData;
        
        // 填充班级选择器
        classSelect.innerHTML = '';
        examData.classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            classSelect.appendChild(option);
        });
        classSelect.disabled = false;
    });
    
    // 添加班级切换事件
    const classSelect = document.getElementById('classSelect');
    classSelect.addEventListener('change', function() {
        if (!this.value || !currentExam) return;
        
        const studentSelect = document.getElementById('studentSelect');
        studentSelect.innerHTML = '<option value="">加载学生中...</option>';
        studentSelect.disabled = true;
        
        // 查找选中的班级
        const selectedClass = currentExam.classes.find(c => c.id === this.value);
        if (!selectedClass) return;
        
        currentClass = selectedClass;
        
        // 填充学生选择器
        studentSelect.innerHTML = '';
        selectedClass.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            studentSelect.appendChild(option);
        });
        studentSelect.disabled = false;
    });
    
    // 添加学生切换事件
    const studentSelect = document.getElementById('studentSelect');
    studentSelect.addEventListener('change', function() {
        if (!this.value || !currentClass) return;
        
        // 查找选中的学生
        const selectedStudent = currentClass.students.find(s => s.id === this.value);
        if (!selectedStudent) return;
        
        currentStudent = selectedStudent;
        
        // 更新学生成绩数据
        updateStudentData(selectedStudent);
    });
}

// 更新学生数据
function updateStudentData(student) {
    if (!student || !student.subjects) return;
    
    // 计算统计数据
    const scores = student.subjects.map(subject => subject.score);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    const maxSubject = student.subjects.find(subject => subject.score === maxScore);
    const minSubject = student.subjects.find(subject => subject.score === minScore);
    
    // 更新统计卡片
    document.getElementById('avgScore').textContent = avgScore.toFixed(1);
    document.getElementById('scoreChange').innerHTML = `
        <i class="fas fa-arrow-up"></i>
        <span>${student.stats?.change || 0}%</span>
    `;
    document.getElementById('highestScore').textContent = maxScore;
    document.getElementById('highestSubject').textContent = maxSubject?.name || '--';
    document.getElementById('lowestScore').textContent = minScore;
    document.getElementById('lowestSubject').textContent = minSubject?.name || '--';
    document.getElementById('classRank').textContent = student.stats?.rank || '--';
    document.getElementById('rankPercent').textContent = student.stats?.rankPercent || '--';
    
    // 更新表格
    const tableBody = document.getElementById('scoreTableBody');
    tableBody.innerHTML = '';
    
    student.subjects.forEach(subject => {
        const row = document.createElement('tr');
        
        // 确定成绩等级
        let gradeClass = 'score-average';
        if (subject.score >= 90) gradeClass = 'score-excellent';
        else if (subject.score >= 80) gradeClass = 'score-good';
        else if (subject.score >= 70) gradeClass = 'score-average';
        else gradeClass = 'score-poor';
        
        row.innerHTML = `
            <td class="subject-name">${subject.name}</td>
            <td class="score-cell ${gradeClass}">${subject.score}</td>
            <td>${subject.score >= 90 ? '优秀' : subject.score >= 80 ? '良好' : subject.score >= 70 ? '中等' : '及格'}</td>
            <td>${subject.classAvg?.toFixed(1) || '--'}</td>
            <td>${subject.rank || '--'}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // 更新图表
    updateCharts(student);
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
    
    // 更新趋势图表（这里需要历史数据，暂时不实现）
}

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

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initCharts();
    
    // 添加刷新图表按钮事件
    document.getElementById('refreshCharts').addEventListener('click', function() {
        if (trendChart) trendChart.update();
        if (subjectChart) subjectChart.update();
    });
    
    // 添加筛选按钮事件
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // 添加导航项事件
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
});