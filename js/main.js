// 当前选中的考试、班级和学生
let currentExam = null;
let currentClass = null;
let currentStudent = null;
let currentClassStudents = [];

// 初始化应用
function initApp() {
    // 确保数据已加载
    if (!window.examsData) {
        console.error('考试数据未加载');
        return;
    }
    
    // 填充考试选择器
    const examSelect = document.getElementById('examSelect');
    if (!examSelect) return;
    
    examSelect.innerHTML = '';
    
    window.examsData.forEach(exam => {
        const option = document.createElement('option');
        option.value = exam.id;
        option.textContent = exam.name;
        examSelect.appendChild(option);
    });
    
    // 添加考试切换事件
    examSelect.addEventListener('change', function() {
        if (!this.value) {
            // 重置班级和学生选择器
            const classSelect = document.getElementById('classSelect');
            if (classSelect) {
                classSelect.innerHTML = '<option value="">请先选择考试</option>';
                classSelect.disabled = true;
            }
            
            const studentSelect = document.getElementById('studentSelect');
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">请先选择班级</option>';
                studentSelect.disabled = true;
            }
            
            // 隐藏数据区域
            hideDataSections();
            return;
        }
        
        // 重置班级和学生选择器
        const classSelect = document.getElementById('classSelect');
        if (classSelect) {
            classSelect.innerHTML = '<option value="">加载班级中...</option>';
            classSelect.disabled = false;
        }
        
        const studentSelect = document.getElementById('studentSelect');
        if (studentSelect) {
            studentSelect.innerHTML = '<option value="">请先选择班级</option>';
            studentSelect.disabled = true;
        }
        
        // 加载考试数据
        const examData = window.examsData.find(e => e.id == this.value);
        if (!examData) {
            alert('无法加载考试数据');
            return;
        }
        
        currentExam = examData;
        
        // 填充班级选择器
        if (classSelect) {
            classSelect.innerHTML = '<option value="">请选择班级</option>';
            examData.classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.id;
                option.textContent = cls.name;
                classSelect.appendChild(option);
            });
            classSelect.disabled = false;
        }
    });
    
    // 添加班级切换事件
    const classSelect = document.getElementById('classSelect');
    if (classSelect) {
        classSelect.addEventListener('change', function() {
            if (!this.value || !currentExam) {
                // 重置学生选择器
                const studentSelect = document.getElementById('studentSelect');
                if (studentSelect) {
                    studentSelect.innerHTML = '<option value="">请先选择班级</option>';
                    studentSelect.disabled = true;
                }
                
                // 隐藏数据区域
                hideDataSections();
                return;
            }
            
            const studentSelect = document.getElementById('studentSelect');
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">加载学生中...</option>';
                studentSelect.disabled = false;
            }
            
            // 查找选中的班级
            const selectedClass = currentExam.classes.find(c => c.id === this.value);
            if (!selectedClass) return;
            
            currentClass = selectedClass;
            currentClassStudents = selectedClass.students;
            
            // 填充学生选择器
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">请选择学生</option>';
                selectedClass.students.forEach(student => {
                    const option = document.createElement('option');
                    option.value = student.id;
                    option.textContent = student.name;
                    studentSelect.appendChild(option);
                });
                studentSelect.disabled = false;
            }
        });
    }
    
    // 添加学生切换事件
    const studentSelect = document.getElementById('studentSelect');
    if (studentSelect) {
        studentSelect.addEventListener('change', function() {
            if (!this.value || !currentClass) {
                // 隐藏数据区域
                hideData极简Sections();
                return;
            }
            
            // 查找选中的学生
            const selectedStudent = currentClass.students.find(s => s.id === this.value);
            if (!selectedStudent) return;
            
            currentStudent = selectedStudent;
            
            // 更新学生成绩数据
            updateStudentData(selectedStudent);
            
            // 显示数据区域
            showDataSections();
        });
    }
    
    // 添加刷新图表按钮事件
    const refreshButton = document.getElementById('refreshCharts');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            if (window.trendChart) window.trendChart.update();
            if (window.subjectChart) window.subjectChart.update();
        });
    }
    
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
}

// 隐藏数据区域
function hideDataSections() {
    const statsGrid = document.getElementById('statsGrid');
    const scoreSection = document.getElementById('scoreSection');
    const chartSection = document.getElementById('chartSection');
    const subjectChartSection = document.getElementById('subjectChartSection');
    const dataHint = document.getElementById('dataHint');
    
    if (statsGrid) statsGrid.style.display = 'none';
    if (scoreSection) scoreSection.style.display = 'none';
    if (chartSection) chartSection.style.display = 'none';
    if (subjectChartSection) subjectChartSection.style.display = 'none';
    if (dataHint) dataHint.style.display = 'block';
}

// 显示数据区域
function showDataSections() {
    const statsGrid = document.getElementById('statsGrid');
    const scoreSection = document.getElementById('scoreSection');
    const chartSection = document.getElementById('chartSection');
    const subjectChartSection = document.getElementById('subjectChartSection');
    const dataHint = document.getElementById('dataHint');
    
    if (statsGrid) statsGrid.style.display = 'grid';
    if (scoreSection) scoreSection.style.display = 'block';
    if (chartSection) chartSection.style.display = 'block';
    if (subjectChartSection) subjectChartSection.style.display = 'block';
    if (dataHint) dataHint.style.display = 'none';
}

// 计算学生统计数据
function calculateStudentStats(student) {
    const stats = {};
    
    // 计算平均分
    const totalScore = student.subjects.reduce((sum, subject) => sum + subject.score, 0);
    stats.average = totalScore / student.subjects.length;
    
    // 计算最高分和最低分
    let highestScore = -1;
    let lowestScore = 101;
    let highestSubject = '';
    let lowestSubject = '';
    
    student.subjects.forEach(subject => {
        if (subject.score > highestScore) {
            highestScore = subject.score;
            highestSubject = subject.name;
        }
        if (subject.score < lowestScore) {
            lowestScore = subject.score;
            lowestSubject = subject.name;
        }
    });
    
    stats.highestScore = highestScore;
    stats.highestSubject = highestSubject;
    stats.lowestScore = lowestScore;
    stats.lowestSubject = lowestSubject;
    
    // 计算班级排名
    const studentScores = currentClassStudents.map(s => {
        const total = s.subjects.reduce((sum, subject) => sum + subject.score, 0);
        return { id: s.id, total };
    });
    
    studentScores.sort((a, b) => b.total - a.total);
    
    const rankIndex = studentScores.findIndex(s => s.id === student.id);
    stats.rank = `${rankIndex + 1}/${currentClassStudents.length}`;
    
    // 计算排名百分比
    const rankPercent = ((currentClassStudents.length - rankIndex) / currentClassStudents.length * 100).toFixed(1);
    stats.rankPercent = `前 ${rankPercent}%`;
    
    // 计算成绩变化（如果有上一次考试数据）
    if (window.previousExamData) {
        const prevStudent = window.previousExamData.classes
            .flatMap(c => c.students)
            .find(s => s.id === student.id);
        
        if (prevStudent) {
            const prevTotal = prevStudent.subjects.reduce((sum, subject) => sum + subject.score, 0);
            const change = ((totalScore - prevTotal) / prevTotal * 100).toFixed(1);
            stats.change = Math.abs(change);
            stats.changeDirection = change >= 0 ? 'up' : 'down';
        }
    }
    
    return stats;
}

// 计算班级科目平均分
function calculateClassAverages() {
    const classAverages = {};
    
    currentClassStudents.forEach(student => {
        student.subjects.forEach(subject => {
            if (!classAverages[subject.name]) {
                classAverages[subject.name] = {
                    total: 0,
                    count: 0
                };
            }
            classAverages[subject.name].total += subject.score;
            classAverages[subject.name].count++;
        });
    });
    
    // 计算平均值
    for (const subject in classAverages) {
        classAverages[subject] = classAverages[subject].total / classAverages[subject].count;
    }
    
    return classAverages;
}

// 计算科目排名
function calculateSubjectRanks(student) {
    const subjectRanks = {};
    
    // 初始化排名数据结构
    const allSubjectRanks = {};
    student.subjects.forEach(subject => {
        allSubjectRanks[subject.name] = [];
    });
    
    // 收集所有学生成绩
    currentClassStudents.forEach(s => {
        s.subjects.forEach(subject => {
            if (allSubjectRanks[subject.name]) {
                allSubjectRanks[subject.name].push({
                    studentId: s.id,
                    score: subject.score
                });
            }
        });
    });
    
    // 对每个科目进行排序
    for (const subject in allSubjectRanks) {
        allSubjectRanks[subject].sort((a, b) => b.score - a.score);
        
        // 找到当前学生的排名
        const rankIndex = allSubjectRanks[subject].findIndex(s => s.studentId === student.id);
        if (rankIndex !== -1) {
            subjectRanks[subject] = `${rankIndex + 1}/${allSubjectRanks[subject].length}`;
        }
    }
    
    return subjectRanks;
}

// 更新学生数据
function updateStudentData(student) {
    if (!student || !student.subjects) return;
    
    // 计算统计数据
    const stats = calculateStudentStats(student);
    const classAverages = calculateClassAverages();
    const subjectRanks = calculateSubjectRanks(student);
    
    // 更新统计卡片
    const avgScore = document.getElementById('avgScore');
    const scoreChange = document.getElementById('scoreChange');
    const highestScore = document.getElementById('highestScore');
    const highestSubject = document.getElementById('highestSubject');
    const lowestScore = document.getElementById('lowestScore');
    const lowestSubject = document.getElementById('lowestSubject');
    const classRank = document.getElementById('classRank');
    const rankPercent = document.getElementById('rankPercent');
    
    if (avgScore) avgScore.textContent = stats.average.toFixed(1);
    
    if (scoreChange) {
        if (stats.change) {
            scoreChange.innerHTML = `
                <i class="fas fa-arrow-${stats.changeDirection === 'up' ? 'up' : 'down'}"></i>
                <span>${stats.change}%</span>
            `;
            scoreChange.className = `stat-change ${stats.changeDirection === 'up' ? '' : 'down'}`;
        } else {
            scoreChange.innerHTML = '<span>--%</span>';
        }
    }
    
    if (highestScore) highestScore.textContent = stats.highestScore;
    if (highestSubject) highestSubject.textContent = stats.highestSubject;
    if (lowestScore) lowestScore.textContent = stats.lowestScore;
    if (lowestSubject) lowestSubject.textContent = stats.lowestSubject;
    if (classRank) classRank.textContent = stats.rank;
    if (rankPercent) rankPercent.textContent = stats.rankPercent;
    
    // 更新表格
    const tableBody = document.getElementById('scoreTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        
        student.subjects.forEach(subject => {
            const row = document.createElement('tr');
            
            // 确定成绩等级
            let gradeClass = 'score-average';
            if (subject.score >= 90) gradeClass = 'score-excellent';
            else if (subject.score >= 80) gradeClass = 'score-good';
            else if (subject.score >= 70) gradeClass = 'score-average';
            else gradeClass = 'score-poor';
            
            // 获取班级平均分和排名
            const classAvg = classAverages[subject.name] ? classAverages[subject.name].toFixed(1) : '--';
            const rank = subjectRanks[subject.name] || '--';
            
            row.innerHTML = `
                <td class="subject-name">${subject.name}</td>
                <td class="score-cell ${gradeClass}">${subject.score}</td>
                <td>${subject.score >= 90 ? '优秀' : subject.score >= 80 ? '良好' : subject.score >= 70 ? '中等' : '及格'}</td>
                <td>${classAvg}</td>
                <td>${rank}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // 更新图表
    if (typeof updateCharts === 'function') {
        updateCharts(student);
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', function() {
    // 初始隐藏数据区域
    hideDataSections();
    
    // 初始化应用
    if (typeof initApp === 'function') {
        initApp();
    }
});