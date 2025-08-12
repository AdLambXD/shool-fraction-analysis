// 本地数据源配置
const localDataSource = {
    name: "本地数据源",
    indexUrl: "data/index.json"
};

// 存储考试数据的缓存
let examsIndexCache = null;
let examDataCache = {};
let historicalDataCache = null;

// 当前选中的考试、班级和学生
let currentExam = null;
let currentClass = null;
let currentStudent = null;
let currentClassStudents = [];

// 显示加载状态
function showLoading() {
    document.getElementById('dataHint').innerHTML = `
        <div class="loading-spinner"></div>
        <p>加载数据中...</p>
    `;
}

// 隐藏加载状态
function hideLoading() {
    document.getElementById('dataHint').innerHTML = `
        <i class="fas fa-mouse-pointer"></i>
        <p>请选择考试、班级和学生查看成绩数据</p>
    `;
}

// 加载数据源
function loadDataSource() {
    showLoading();
    
    // 加载本地索引文件
    fetch(localDataSource.indexUrl)
        .then(response => {
            if (!response.ok) throw new Error('本地索引文件加载失败');
            return response.json();
        })
        .then(indexData => {
            examsIndexCache = indexData;
            populateExamSelector(indexData.exams);
            hideLoading();
        })
        .catch(error => {
            console.error('加载本地数据失败:', error);
            hideLoading();
            alert('加载本地数据失败，请检查数据文件');
        });
}

// 填充考试选择器
function populateExamSelector(exams) {
    const examSelect = document.getElementById('examSelect');
    examSelect.innerHTML = '<option value="">请选择考试</option>';
    
    exams.forEach(exam => {
        const option = document.createElement('option');
        option.value = exam.id;
        option.textContent = exam.name;
        examSelect.appendChild(option);
    });
}

// 加载考试数据
function loadExamData(examId) {
    showLoading();
    
    // 检查缓存中是否已有该考试数据
    if (examDataCache[examId]) {
        currentExam = examDataCache[examId];
        
        // 确保考试数据包含班级信息
        if (!currentExam.classes || !Array.isArray(currentExam.classes)) {
            console.error('缓存中的考试数据缺少班级信息');
            alert('考试数据格式错误，缺少班级信息');
            hideLoading();
            return;
        }
        
        populateClassSelector(currentExam.classes);
        hideLoading();
        return;
    }
    
    // 从索引中查找考试数据文件位置
    const examInfo = examsIndexCache.exams.find(e => e.id == examId);
    if (!examInfo) {
        alert('找不到考试信息');
        hideLoading();
        return;
    }
    
    console.log(`加载考试数据: ${examInfo.name}`);
    console.log(`数据文件URL: ${examInfo.dataFile}`);
    
    // 加载考试数据文件
    fetch(examInfo.dataFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`网络响应异常: ${response.status}`);
            }
            return response.json();
        })
        .then(examData => {
            // 缓存考试数据
            examDataCache[examId] = examData;
            currentExam = examData;
            
            // 确保考试数据包含班级信息
            if (!examData.classes || !Array.isArray(examData.classes)) {
                throw new Error('考试数据中缺少班级信息');
            }
            
            // 填充班级选择器
            populateClassSelector(examData.classes);
            hideLoading();
        })
        .catch(error => {
            console.error('加载考试数据失败:', error);
            hideLoading();
            alert(`加载考试数据失败: ${examInfo.name}\n${error.message}`);
        });
}

// 填充班级选择器
function populateClassSelector(classes) {
    const classSelect = document.getElementById('classSelect');
    classSelect.innerHTML = '<option value="">请选择班级</option>';
    
    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        classSelect.appendChild(option);
    });
    classSelect.disabled = false;
}

// 更新学生选择器
function updateStudentSelector(classId) {
    const studentSelect = document.getElementById('studentSelect');
    studentSelect.innerHTML = '<option value="">加载学生中...</option>';
    studentSelect.disabled = false;
    
    // 确保 currentExam 和 currentExam.classes 存在
    if (!currentExam || !currentExam.classes || !Array.isArray(currentExam.classes)) {
        console.error('currentExam.classes 未定义或不是数组');
        resetStudentSelector();
        return;
    }
    
    // 查找选中的班级
    const selectedClass = currentExam.classes.find(c => c.id === classId);
    if (!selectedClass) {
        console.error(`找不到班级: ${classId}`);
        resetStudentSelector();
        return;
    }
    
    currentClass = selectedClass;
    currentClassStudents = selectedClass.students;
    
    // 确保班级中有学生数据
    if (!selectedClass.students || !Array.isArray(selectedClass.students)) {
        console.error('班级数据中缺少学生信息');
        resetStudentSelector();
        return;
    }
    
    // 填充学生选择器
    studentSelect.innerHTML = '<option value="">请选择学生</option>';
    selectedClass.students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name;
        studentSelect.appendChild(option);
    });
    studentSelect.disabled = false;
}

// 重置学生选择器
function resetStudentSelector() {
    const studentSelect = document.getElementById('studentSelect');
    studentSelect.innerHTML = '<option value="">请先选择班级</option>';
    studentSelect.disabled = true;
}

// 计算学生统计数据
function calculateStudentStats(student) {
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

// 更新成绩表格
function updateScoreTable(student, classAverages, subjectRanks) {
    const tableBody = document.getElementById('scoreTableBody');
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
}

// 导出成绩表格为CSV
function exportToCSV() {
    if (!currentStudent) return;
    
    let csvContent = "科目,成绩,等级,班级平均,排名\n";
    
    const classAverages = calculateClassAverages();
    const subjectRanks = calculateSubjectRanks(currentStudent);
    
    currentStudent.subjects.forEach(subject => {
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
    link.setAttribute("download", `${currentStudent.name}_成绩.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}