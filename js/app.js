// 初始化应用
function initApp() {
    // 设置默认数据源为本地
    setDataSource('local');
    
    // 添加数据源切换事件
    document.getElementById('localSourceBtn').addEventListener('click', () => setDataSource('local'));
    document.getElementById('cloudSource1Btn').addEventListener('click', () => setDataSource('github'));
    document.getElementById('cloudSource2Btn').addEventListener('click', () => setDataSource('gitee'));
    
    // 添加考试切换事件
    const examSelect = document.getElementById('examSelect');
    examSelect.addEventListener('change', function() {
        if (!this.value) {
            resetSelectors();
            hideDataSections();
            return;
        }
        
        const examId = parseInt(this.value);
        loadExamData(examId);
    });
    
    // 添加班级切换事件
    const classSelect = document.getElementById('classSelect');
    classSelect.addEventListener('change', function() {
        if (!this.value || !currentExam) {
            resetStudentSelector();
            hideDataSections();
            return;
        }
        
        updateStudentSelector(this.value);
    });
    
    // 添加学生切换事件
    const studentSelect = document.getElementById('studentSelect');
    studentSelect.addEventListener('change', function() {
        if (!this.value || !currentClass) {
            hideDataSections();
            return;
        }
        
        const selectedStudent = currentClass.students.find(s => s.id === this.value);
        if (selectedStudent) {
            currentStudent = selectedStudent;
            updateStudentData(selectedStudent);
            showDataSections();
        }
    });
    
    // 初始化图表
    initCharts();
}

// 设置数据源
function setDataSource(source) {
    currentDataSource = source;
    
    // 更新UI
    document.querySelectorAll('.source-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${source}SourceBtn`).classList.add('active');
    
    // 重置选择器
    resetSelectors();
    
    // 隐藏数据区域
    hideDataSections();
    
    // 加载数据
    loadDataSource(source);
}

// 更新学生数据
function updateStudentData(student) {
    if (!student || !student.subjects) return;
    
    // 更新学生信息卡片
    document.getElementById('studentName').textContent = student.name;
    document.getElementById('studentClass').textContent = currentClass.name;
    
    // 计算统计数据
    const stats = calculateStudentStats(student);
    const classAverages = calculateClassAverages();
    const subjectRanks = calculateSubjectRanks(student);
    
    // 更新学生信息卡片中的总分和平均分
    document.getElementById('studentTotalScore').textContent = stats.totalScore;
    document.getElementById('studentAvgScore').textContent = stats.average.toFixed(1);
    
    // 更新统计卡片
    document.getElementById('avgScore').textContent = stats.average.toFixed(1);
    document.getElementById('highestScore').textContent = stats.highestScore;
    document.getElementById('highestSubject').textContent = stats.highestSubject;
    document.getElementById('lowestScore').textContent = stats.lowestScore;
    document.getElementById('lowestSubject').textContent = stats.lowestSubject;
    document.getElementById('classRank').textContent = stats.rank;
    document.getElementById('rankPercent').textContent = stats.rankPercent;
    
    // 更新表格
    updateScoreTable(student, classAverages, subjectRanks);
    
    // 更新图表
    updateCharts(student);
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    // 初始隐藏数据区域
    hideDataSections();
    
    // 初始化应用
    initApp();
    
    // 添加刷新图表按钮事件
    document.getElementById('refreshCharts').addEventListener('click', function() {
        if (trendChart) trendChart.update();
        if (subjectChart) subjectChart.update();
    });
    
    // 添加导出按钮事件
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    
    // 添加全屏按钮事件
    document.getElementById('fullscreenBtn').addEventListener('click', function() {
        const elem = document.getElementById('scoreSection');
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
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