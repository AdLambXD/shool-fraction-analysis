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

// 隐藏数据区域
function hideDataSections() {
    document.getElementById('studentInfo').style.display = 'none';
    document.getElementById('statsGrid').style.display = 'none';
    document.getElementById('scoreSection').style.display = 'none';
    document.getElementById('chartSection').style.display = 'none';
    document.getElementById('subjectChartSection').style.display = 'none';
    document.getElementById('dataHint').style.display = 'block';
}

// 显示数据区域
function showDataSections() {
    document.getElementById('studentInfo').style.display = 'block';
    document.getElementById('statsGrid').style.display = 'grid';
    document.getElementById('scoreSection').style.display = 'block';
    document.getElementById('chartSection').style.display = 'block';
    document.getElementById('subjectChartSection').style.display = 'block';
    document.getElementById('dataHint').style.display = 'none';
}

// 重置选择器
function resetSelectors() {
    document.getElementById('examSelect').innerHTML = '<option value="">请选择考试</option>';
    document.getElementById('classSelect').innerHTML = '<option value="">请先选择考试</option>';
    document.getElementById('classSelect').disabled = true;
    document.getElementById('studentSelect').innerHTML = '<option value="">请先选择班级</option>';
    document.getElementById('studentSelect').disabled = true;
}

// 重置学生选择器
function resetStudentSelector() {
    document.getElementById('studentSelect').innerHTML = '<option value="">请先选择班级</option>';
    document.getElementById('studentSelect').disabled = true;
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