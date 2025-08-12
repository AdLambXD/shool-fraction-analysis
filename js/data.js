// 确保数据在全局作用域可用
window.examsData = [
    {
        id: 1,
        name: "2023-2024学年第一学期期末考试",
        date: "2023-12-15",
        classes: [
            {
                id: "class1",
                name: "软件工程1班",
                students: [
                    {
                        id: "stu101",
                        name: "张三",
                        gender: "男",
                        subjects: [
                            {name: "语文", score: 85},
                            {name: "数学", score: 96},
                            {name: "英语", score: 89},
                            {name: "物理", score: 78},
                            {name: "化学", score: 86},
                            {name: "生物", score: 88},
                            {name: "历史", score: 92}
                        ]
                    },
                    {
                        id: "stu102",
                        name: "李四",
                        gender: "女",
                        subjects: [
                            {name: "语文", score: 83},
                            {name: "数学", score: 90},
                            {name: "英语", score: 87},
                            {name: "物理", score: 79},
                            {name: "化学", score: 84},
                            {name: "生物", score: 85},
                            {name: "历史", score: 89}
                        ]
                    }
                ]
            },
            {
                id: "class2",
                name: "软件工程2班",
                students: [
                    {
                        id: "stu201",
                        name: "王五",
                        gender: "男",
                        subjects: [
                            {name: "语文", score: 88},
                            {name: "数学", score: 92},
                            {name: "英语", score: 90},
                            {name: "物理", score: 82},
                            {name: "化学", score: 85},
                            {name: "生物", score: 87},
                            {name: "历史", score: 89}
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 2,
        name: "2023-2024学年期中考试",
        date: "2023-10-20",
        classes: [
            {
                id: "class1",
                name: "软件工程1班",
                students: [
                    {
                        id: "stu101",
                        name: "张三",
                        gender: "男",
                        subjects: [
                            {name: "语文", score: 82},
                            {name: "数学", score: 90},
                            {name: "英语", score: 85},
                            {name: "物理", score: 75},
                            {name: "化学", score: 80},
                            {name: "生物", score: 83},
                            {name: "历史", score: 88}
                        ]
                    },
                    {
                        id: "stu102",
                        name: "李四",
                        gender: "女",
                        subjects: [
                            {name: "语文", score: 80},
                            {name: "数学", score: 85},
                            {name: "英语", score: 82},
                            {name: "物理", score: 76},
                            {name: "化学", score: 78},
                            {name: "生物", score: 80},
                            {name: "历史", score: 84}
                        ]
                    }
                ]
            }
        ]
    }
];

// 模拟上一次考试数据
window.previousExamData = window.examsData.find(e => e.id === 2);