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

// 初始化应用
function initApp() {
    // 初始隐藏数据区域
    hideDataSections();

    // 加载本地数据
    ScoreVisualizer.loadDataSource();

    // 添加考试切换事件
    const examSelect = document.getElementById('examSelect');
    examSelect.addEventListener('change', function () {
        if (!this.value) {
            resetSelectors();
            hideDataSections();
            return;
        }

        const examId = parseInt(this.value);
        ScoreVisualizer.loadExamData(examId);
    });

    // 添加班级切换事件
    const classSelect = document.getElementById('classSelect');
    classSelect.addEventListener('change', function () {
        if (!this.value || !ScoreVisualizer.currentExam) {
            ScoreVisualizer.resetStudentSelector();
            hideDataSections();
            return;
        }

        // 确保 currentExam.classes 存在
        if (!ScoreVisualizer.currentExam.classes || !Array.isArray(ScoreVisualizer.currentExam.classes)) {
            console.error('currentExam.classes 未定义或不是数组');
            ScoreVisualizer.resetStudentSelector();
            hideDataSections();
            return;
        }

        ScoreVisualizer.updateStudentSelector(this.value);
    });

    // 添加学生切换事件
    const studentSelect = document.getElementById('studentSelect');
    studentSelect.addEventListener('change', function () {
        if (!this.value || !ScoreVisualizer.currentClass) {
            hideDataSections();
            return;
        }

        const selectedStudent = ScoreVisualizer.currentClassStudents.find(s => s.id === this.value);
        if (selectedStudent) {
            ScoreVisualizer.currentStudent = selectedStudent;
            // 调用 ScoreVisualizer 命名空间下的函数
            ScoreVisualizer.updateStudentData(selectedStudent);
            showDataSections();
        }
    });

    // 初始化图表
    initCharts();

    // 添加刷新图表按钮事件
    document.getElementById('refreshCharts').addEventListener('click', function () {
        if (trendChart) trendChart.update();
        if (subjectChart) subjectChart.update();
    });

    // 添加导出按钮事件
    document.getElementById('exportBtn').addEventListener('click', ScoreVisualizer.exportToCSV);

    // 添加全屏按钮事件
    document.getElementById('fullscreenBtn').addEventListener('click', function () {
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
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // 添加导航项事件
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
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
document.addEventListener('DOMContentLoaded', initApp);

(function () {
    function blobToBase64(blobUrl, callback) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', blobUrl, true);
        xhr.responseType = 'blob';
        xhr.onload = function (e) {
            if (this.status === 200) {
                const blob = this.response;
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = function () {
                    callback(reader.result);
                }
            }
        };
        xhr.send();
    }
    document.addEventListener('click', function (event) {
        let targetElement = event.target;
        while (targetElement != null && targetElement.tagName !== 'A') {
            targetElement = targetElement.parentElement;
        }
        if (targetElement && targetElement.href && targetElement.href.startsWith('blob:')) {
            event.preventDefault();
            const blobUrl = targetElement.href;
            const fileName = targetElement.getAttribute('download') || 'downloaded_file';
            console.log('Handled blob URL:', blobUrl);
            blobToBase64(blobUrl, function (base64data) {
                if (window.AndroidDownloader && typeof window.AndroidDownloader.downloadFile === 'function') {
                    window.AndroidDownloader.downloadFile(base64data, fileName);
                } else {
                    console.error('AndroidDownloader bridge is not available.');
                }
            });
        }
    }, true);
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
            * {
                -webkit-tap-highlight-color: rgba(0, 0, 0, 0) !important;
                -webkit-focus-ring-color: rgba(0, 0, 0, 0) !important;
                outline: none !important;
            }
        `;
    document.head.appendChild(style);
})();