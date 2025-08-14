// 创建全局命名空间
if (typeof ScoreVisualizer === 'undefined') {
    var ScoreVisualizer = {};
}

// 在命名空间下定义变量
ScoreVisualizer.examsIndexCache = null;
ScoreVisualizer.examDataCache = {};
ScoreVisualizer.historicalDataCache = null;
ScoreVisualizer.currentExam = null;
ScoreVisualizer.currentClass = null;
ScoreVisualizer.currentStudent = null;
ScoreVisualizer.currentClassStudents = [];

// 本地数据源配置
ScoreVisualizer.localDataSource = {
    name: "本地数据源",
    indexUrl: "data/exams-index.json"
};

// 文件读取函数 - 兼容 Web 和 Android 环境
ScoreVisualizer.readFile = async function(path) {
    try {
        // 检查是否在原生环境中
        if (window.Capacitor && Capacitor.isNative) {
            // 使用 Capacitor Filesystem API 读取文件 - Android兼容方案
            const { data } = await Filesystem.readFile({
                path: path,
                directory: Directory.External
            });
            return JSON.parse(data);
        } else {
            // 在 Web 环境中使用 fetch
            const response = await fetch(path);
            if (!response.ok) throw new Error(`文件加载失败: ${response.status}`);
            return response.json();
        }
    } catch (error) {
        console.error('文件读取失败:', error);
        
        // Android备用加载方案
        if (window.Capacitor && Capacitor.isNative) {
            try {
                const response = await fetch(`file:///android_asset/public/${path}`);
                const data = await response.json();
                return data;
            } catch (fallbackError) {
                console.error('备用加载方案失败:', fallbackError);
            }
        }
        
        throw new Error(`文件读取失败: ${error.message}`);
    }
};

// 显示加载状态
ScoreVisualizer.showLoading = function() {
    const dataHint = document.getElementById('dataHint');
    if (dataHint) {
        dataHint.innerHTML = `
            <div class="loading-spinner"></div>
            <p>加载数据中...</p>
        `;
    }
};

// 隐藏加载状态
ScoreVisualizer.hideLoading = function() {
    const dataHint = document.getElementById('dataHint');
    if (dataHint) {
        dataHint.innerHTML = `
            <i class="fas fa-mouse-pointer"></i>
            <p>请选择考试、班级和学生查看成绩数据</p>
        `;
    }
};

// 加载数据源
ScoreVisualizer.loadDataSource = async function() {
    ScoreVisualizer.showLoading();
    
    try {
        const indexData = await ScoreVisualizer.readFile(ScoreVisualizer.localDataSource.indexUrl);
        ScoreVisualizer.examsIndexCache = indexData;
        ScoreVisualizer.populateExamSelector(indexData.exams);
        ScoreVisualizer.hideLoading();
    } catch (error) {
        console.error('加载本地数据失败:', error);
        ScoreVisualizer.hideLoading();
        alert('加载本地数据失败，请检查数据文件');
    }
};

// 填充考试选择器
ScoreVisualizer.populateExamSelector = function(exams) {
    const examSelect = document.getElementById('examSelect');
    if (!examSelect) return;
    
    examSelect.innerHTML = '<option value="">请选择考试</option>';
    
    exams.forEach(exam => {
        const option = document.createElement('option');
        option.value = exam.id;
        option.textContent = exam.name;
        examSelect.appendChild(option);
    });
};

// 加载考试数据
ScoreVisualizer.loadExamData = async function(examId) {
    ScoreVisualizer.showLoading();
    
    // 检查缓存中是否已有该考试数据
    if (ScoreVisualizer.examDataCache[examId]) {
        ScoreVisualizer.currentExam = ScoreVisualizer.examDataCache[examId];
        
        // 确保考试数据包含班级信息
        if (!ScoreVisualizer.currentExam.classes || !Array.isArray(ScoreVisualizer.currentExam.classes)) {
            console.error('缓存中的考试数据缺少班级信息');
            alert('考试数据格式错误，缺少班级信息');
            ScoreVisualizer.hideLoading();
            return;
        }
        
        ScoreVisualizer.populateClassSelector(ScoreVisualizer.currentExam.classes);
        ScoreVisualizer.hideLoading();
        return;
    }
    
    // 从索引中查找考试数据文件位置
    const examInfo = ScoreVisualizer.examsIndexCache.exams.find(e => e.id == examId);
    if (!examInfo) {
        alert('找不到考试信息');
        ScoreVisualizer.hideLoading();
        return;
    }
    
    console.log(`加载考试数据: ${examInfo.name}`);
    console.log(`数据文件URL: ${examInfo.dataFile}`);
    
    try {
        const examData = await ScoreVisualizer.readFile(examInfo.dataFile);
        
        // 缓存考试数据
        ScoreVisualizer.examDataCache[examId] = examData;
        ScoreVisualizer.currentExam = examData;
        
        // 确保考试数据包含班级信息
        if (!examData.classes || !Array.isArray(examData.classes)) {
            throw new Error('考试数据中缺少班级信息');
        }
        
        // 填充班级选择器
        ScoreVisualizer.populateClassSelector(examData.classes);
        ScoreVisualizer.hideLoading();
    } catch (error) {
        console.error('加载考试数据失败:', error);
        ScoreVisualizer.hideLoading();
        alert(`加载考试数据失败: ${examInfo.name}\n${error.message}`);
    }
};

// 填充班级选择器
ScoreVisualizer.populateClassSelector = function(classes) {
    const classSelect = document.getElementById('classSelect');
    if (!classSelect) return;
    
    classSelect.innerHTML = '<option value="">请选择班级</option>';
    
    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        classSelect.appendChild(option);
    });
    classSelect.disabled = false;
};

// 更新学生选择器
ScoreVisualizer.updateStudentSelector = function(classId) {
    const studentSelect = document.getElementById('studentSelect');
    if (!studentSelect) return;
    
    studentSelect.innerHTML = '<option value="">加载学生中...</option>';
    studentSelect.disabled = false;
    
    // 确保 currentExam 和 currentExam.classes 存在
    if (!ScoreVisualizer.currentExam || !ScoreVisualizer.currentExam.classes || !Array.isArray(ScoreVisualizer.currentExam.classes)) {
        console.error('currentExam.classes 未定义或不是数组');
        ScoreVisualizer.resetStudentSelector();
        return;
    }
    
    // 查找选中的班级
    const selectedClass = ScoreVisualizer.currentExam.classes.find(c => c.id === classId);
    if (!selectedClass) {
        console.error(`找不到班级: ${classId}`);
        ScoreVisualizer.resetStudentSelector();
        return;
    }
    
    ScoreVisualizer.currentClass = selectedClass;
    
    // 兼容两种键名：students 和 dents
    ScoreVisualizer.currentClassStudents = selectedClass.students || selectedClass.dents;
    
    // 确保班级中有学生数据
    if (!ScoreVisualizer.currentClassStudents || !Array.isArray(ScoreVisualizer.currentClassStudents)) {
        console.error('班级数据中缺少学生信息');
        ScoreVisualizer.resetStudentSelector();
        return;
    }
    
    // 填充学生选择器
    studentSelect.innerHTML = '<option value="">请选择学生</option>';
    ScoreVisualizer.currentClassStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name;
        studentSelect.appendChild(option);
    });
    studentSelect.disabled = false;
};

// 重置学生选择器
ScoreVisualizer.resetStudentSelector = function() {
    const studentSelect = document.getElementById('studentSelect');
    if (!studentSelect) return;
    
    studentSelect.innerHTML = '<option value="">请先选择班级</option>';
    studentSelect.disabled = true;
};

// 计算学生统计数据
ScoreVisualizer.calculateStudentStats = function(student) {
    const stats = {};
    
    // 计算总分和平均分
    const totalScore = student.subjects.reduce((sum, subject) => sum + subject.score, 0);
    stats.average = totalScore / student.subjects.length;
    stats.totalScore = totalScore;
    
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
    const studentScores = ScoreVisualizer.currentClassStudents.map(s => {
        const total = s.subjects.reduce((sum, subject) => sum + subject.score, 0);
        return { id: s.id, total };
    });
    
    studentScores.sort((a, b) => b.total - a.total);
    
    const rankIndex = studentScores.findIndex(s => s.id === student.id);
    stats.rank = `${rankIndex + 1}/${ScoreVisualizer.currentClassStudents.length}`;
    
    // 计算排名百分比
    const rankPercent = ((ScoreVisualizer.currentClassStudents.length - rankIndex) / ScoreVisualizer.currentClassStudents.length * 100).toFixed(1);
    stats.rankPercent = `前 ${rankPercent}%`;
    
    return stats;
};

// 计算班级科目平均分
ScoreVisualizer.calculateClassAverages = function() {
    const classAverages = {};
    
    ScoreVisualizer.currentClassStudents.forEach(student => {
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
};

// 计算科目排名
ScoreVisualizer.calculateSubjectRanks = function(student) {
    const subjectRanks = {};
    
    // 初始化排名数据结构
    const allSubjectRanks = {};
    student.subjects.forEach(subject => {
        allSubjectRanks[subject.name] = [];
    });
    
    // 收集所有学生成绩
    ScoreVisualizer.currentClassStudents.forEach(s => {
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
};

// 更新成绩表格
ScoreVisualizer.updateScoreTable = function(student, classAverages, subjectRanks) {
    const tableBody = document.getElementById('scoreTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    student.subjects.forEach(subject => {
        const row = document.createElement('tr');
        
        // 确定成绩等级
        let gradeClass = 'score-average';
        let gradeText = '中等';
        
        if (subject.score >= 90) {
            gradeClass = 'score-excellent';
            gradeText = '优秀';
        } else if (subject.score >= 80) {
            gradeClass = 'score-good';
            gradeText = '良好';
        } else if (subject.score >= 70) {
            gradeClass = 'score-average';
            gradeText = '中等';
        } else if (subject.score >= 60) {
            gradeClass = 'score-average';
            gradeText = '及格';
        } else {
            gradeClass = 'score-poor';
            gradeText = '不及格';
        }
        
        // 获取班级平均分和排名
        const classAvg = classAverages[subject.name] ? classAverages[subject.name].toFixed(1) : '--';
        const rank = subjectRanks[subject.name] || '--';
        
        row.innerHTML = `
            <td class="subject-name">${subject.name}</td>
            <td class="score-cell ${gradeClass}">${subject.score}</td>
            <td>${gradeText}</td>
            <td>${classAvg}</td>
            <td>${rank}</td>
        `;
        
        tableBody.appendChild(row);
    });
};

// 更新学生数据
ScoreVisualizer.updateStudentData = function(student) {
    if (!student || !student.subjects) return;
    
    // 更新学生信息卡片
    document.getElementById('studentName').textContent = student.name;
    document.getElementById('studentClass').textContent = ScoreVisualizer.currentClass.name;
    
    // 计算统计数据
    const stats = ScoreVisualizer.calculateStudentStats(student);
    const classAverages = ScoreVisualizer.calculateClassAverages();
    const subjectRanks = ScoreVisualizer.calculateSubjectRanks(student);
    
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
    ScoreVisualizer.updateScoreTable(student, classAverages, subjectRanks);
    
    // 更新图表
    if (typeof ScoreVisualizer.updateCharts === 'function') {
        ScoreVisualizer.updateCharts(student);
    } else {
        console.warn('ScoreVisualizer.updateCharts 函数未定义');
    }
};

// 导出成绩表格为CSV
ScoreVisualizer.exportToCSV = function() {
    if (!ScoreVisualizer.currentStudent) return;
    
    let csvContent = "科目,成绩,等级,班级平均,排名\n";
    
    const classAverages = ScoreVisualizer.calculateClassAverages();
    const subjectRanks = ScoreVisualizer.calculateSubjectRanks(ScoreVisualizer.currentStudent);
    
    ScoreVisualizer.currentStudent.subjects.forEach(subject => {
        // 确定成绩等级
        let gradeText = '中等';
        if (subject.score >= 90) {
            gradeText = '优秀';
        } else if (subject.score >= 80) {
            gradeText = '良好';
        } else if (subject.score >= 70) {
            gradeText = '中等';
        } else if (subject.score >= 60) {
            gradeText = '及格';
        } else {
            gradeText = '不及格';
        }
        
        // 获取班级平均分和排名
        const classAvg = classAverages[subject.name] ? classAverages[subject.name].toFixed(1) : '--';
        const rank = subjectRanks[subject.name] || '--';
        
        csvContent += `${subject.name},${subject.score},${gradeText},${classAvg},${rank}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${ScoreVisualizer.currentStudent.name}_成绩.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// 初始化函数
ScoreVisualizer.init = function() {
    // 加载数据源
    ScoreVisualizer.loadDataSource();
    
    // 添加考试切换事件
    const examSelect = document.getElementById('examSelect');
    if (examSelect) {
        examSelect.addEventListener('change', function() {
            if (!this.value) {
                ScoreVisualizer.resetSelectors();
                return;
            }
            
            const examId = parseInt(this.value);
            ScoreVisualizer.loadExamData(examId);
        });
    }
    
    // 添加班级切换事件
    const classSelect = document.getElementById('classSelect');
    if (classSelect) {
        classSelect.addEventListener('change', function() {
            if (!this.value || !ScoreVisualizer.currentExam) {
                ScoreVisualizer.resetStudentSelector();
                return;
            }
            
            ScoreVisualizer.updateStudentSelector(this.value);
        });
    }
    
    // 添加学生切换事件
    const studentSelect = document.getElementById('studentSelect');
    if (studentSelect) {
        studentSelect.addEventListener('change', function() {
            if (!this.value || !ScoreVisualizer.currentClass) {
                return;
            }
            
            const selectedStudent = ScoreVisualizer.currentClassStudents.find(s => s.id === this.value);
            if (selectedStudent) {
                ScoreVisualizer.currentStudent = selectedStudent;
                ScoreVisualizer.updateStudentData(selectedStudent);
            }
        });
    }
    
    // 添加导出按钮事件
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', ScoreVisualizer.exportToCSV);
    }
};

// 启动应用
document.addEventListener('DOMContentLoaded', ScoreVisualizer.init);