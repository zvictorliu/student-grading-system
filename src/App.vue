<template>
  <div id="app" @keydown="handleKeydown">
    <h1>学生成绩录入系统</h1>

    <!-- 选择作业 -->
    <div>
      <label for="assignment-select">选择作业：</label>
      <select id="assignment-select" v-model="selectedAssignment" style="margin-right: 10px;">
        <option v-for="assignment in assignments" :key="assignment" :value="assignment">
          {{ assignment }}
        </option>
      </select>
    </div>

    <!-- 搜索框 -->
    <div>
      <label for="search-input">搜索学生：</label>
      <input
        id="search-input"
        type="text"
        placeholder="输入学号或姓名"
        v-model="searchQuery"
        @input="handleSearch"
        @keydown.down="selectNextResult"
        @keydown.up="selectPreviousResult"
        @keydown.enter="confirmSelection"
        style="width: 300px; padding: 5px;"
        ref="searchInput"
      />
    </div>

    <!-- 模糊搜索候选项 -->
    <ul v-if="searchResults.length > 0" class="search-results">
      <li
        v-for="(student, index) in searchResults"
        :key="student.id"
        @click="handleSelectStudent(student)"
        :class="{ 'selected-result': index === selectedResultIndex }"
      >
        {{ student.name }} ({{ student.id }})
      </li>
    </ul>

    <!-- 学生信息和成绩输入框 -->
    <div v-if="selectedStudent" class="student-info">
      <h2>当前学生：{{ selectedStudent.name }} ({{ selectedStudent.id }})</h2>
      <div>
        <label for="grade-input">成绩：</label>
        <input
          id="grade-input"
          type="text"
          v-model="gradeInput"
          class="grade-input"
          ref="gradeInput"
        />
        <button @click="handleSaveGrade" class="save-button">
          保存成绩
        </button>
      </div>
    </div>

    <!-- 显示所有学生数据 -->
    <div v-if="students.length > 0" class="students-data">
      <h2>所有学生数据</h2>
      <button @click="exportGrades" class="export-button">
        导出成绩
      </button>
      <table class="students-table">
        <thead>
          <tr>
            <th>学号</th>
            <th>姓名</th>
            <th v-for="assignment in assignments" :key="assignment">{{ assignment }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.id">
            <td>{{ student.id }}</td>
            <td>{{ student.name }}</td>
            <td v-for="assignment in assignments" :key="assignment">{{ student.grades[assignment] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 作者信息和项目链接 -->
    <footer class="footer">
      <p>作者: Zongwei</p>
      <p>项目链接: <a href="https://github.com/zongwei/vue-demo" target="_blank">GitHub</a></p>
    </footer>
  </div>
</template>

<style>
#app {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.search-results {
  list-style: none;
  padding: 0;
  margin: 10px 0;
}

.search-results li {
  padding: 5px;
  cursor: pointer;
  background-color: #f0f0f0;
}

.search-results li.selected-result {
  background-color: #d3d3d3;
}

.student-info {
  margin-top: 20px;
}

.grade-input {
  width: 100px;
  padding: 5px;
}

.save-button {
  margin-left: 10px;
  padding: 5px 10px;
}

.students-data {
  margin-top: 20px;
}

.export-button {
  margin-bottom: 10px;
  padding: 5px 10px;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 auto;
}

.students-table th,
.students-table td {
  border: 1px solid #ddd;
  padding: 8px;
}

.students-table th {
  background-color: #f2f2f2;
  text-align: center;
}

.students-table td {
  text-align: center;
}

.footer {
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.footer a {
  color: #007bff;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}
</style>

<script>
import Papa from 'papaparse';

export default {
  data() {
    return {
      students: [], // 学生数据
      searchQuery: '', // 搜索框输入内容
      searchResults: [], // 模糊搜索结果
      selectedStudent: null, // 当前选中的学生
      gradeInput: '', // 成绩输入框内容
      selectedResultIndex: -1, // 当前选中的搜索结果索引
      assignments: [], // 作业列表
      selectedAssignment: '', // 当前选中的作业
    };
  },
  mounted() {
    this.loadStudentsData(); // 组件加载时读取 CSV 数据
  },
  methods: {
    // 读取 CSV 数据
    loadStudentsData() {
      // CSV 文件路径（放在 public 目录下）
      const csvFilePath = '/students.csv';

      // 使用 papaparse 解析 CSV 文件
      Papa.parse(csvFilePath, {
        download: true, // 从 URL 下载文件
        header: true, // 第一行为表头
        dynamicTyping: true, // 自动转换数据类型
        complete: (results) => {
          // 获取 CSV 文件的 header
          const headers = results.meta.fields;
          // 过滤出作业列（假设作业列以 "作业" 开头）
          this.assignments = headers.filter(header => header.startsWith('作业'));
          // 设置默认选中的作业
          this.selectedAssignment = this.assignments[0] || '';

          // 解析完成后，将数据保存到 students 中
          this.students = results.data.map(student => {
            const grades = {};
            this.assignments.forEach(assignment => {
              grades[assignment] = student[assignment] || '';
            });
            return {
              ...student,
              grades,
            };
          });
          console.log('CSV 文件读取成功：', this.students);
        },
        error: (error) => {
          console.error('CSV 文件读取失败：', error);
          alert('CSV 文件读取失败！');
        },
      });
    },
    // 处理搜索框输入
    handleSearch() {
      console.log('searchQuery:', this.searchQuery);
      if (this.searchQuery) {
        this.searchResults = this.students.filter(
          (student) =>
            student.id.toString().includes(this.searchQuery) ||
            student.name.includes(this.searchQuery)
        );
      } else {
        this.searchResults = [];
      }
      this.selectedResultIndex = -1; // 重置选中索引
    },

    // 选择学生
    handleSelectStudent(student) {
      this.selectedStudent = student;
      this.gradeInput = student.grades[this.selectedAssignment];
      this.searchQuery = '';
      this.searchResults = [];
    },

    // 保存成绩
    handleSaveGrade() {
      if (this.selectedStudent) {
        const student = this.students.find(
          (s) => s.id === this.selectedStudent.id
        );
        if (student) {
          student.grades[this.selectedAssignment] = this.gradeInput;
          // alert('成绩保存成功！');
          console.log('成绩保存成功：', student);
        }
      }
    },

    // 选择下一个搜索结果
    selectNextResult() {
      if (this.selectedResultIndex < this.searchResults.length - 1) {
        this.selectedResultIndex++;
      }
    },

    // 选择上一个搜索结果
    selectPreviousResult() {
      if (this.selectedResultIndex > 0) {
        this.selectedResultIndex--;
      }
    },

    // 确认选择
    confirmSelection() {
      if (this.selectedResultIndex >= 0 && this.searchResults.length > 0) {
        this.handleSelectStudent(this.searchResults[this.selectedResultIndex]);
      }
    },

    // 处理全局键盘事件
    handleKeydown(event) {
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        this.$refs.searchInput.focus();
      } else if (event.ctrlKey && event.key === 'g') {
        event.preventDefault();
        if (this.selectedStudent) {
          this.$refs.gradeInput.focus();
        }
      } else if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        this.handleSaveGrade();
      }
    },

    // 导出成绩
    exportGrades() {
      const data = this.students.map(student => {
        const studentData = {
          学号: student.id,
          姓名: student.name,
        };
        this.assignments.forEach(assignment => {
          studentData[assignment] = student.grades[assignment];
        });
        return studentData;
      });

      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `学生成绩_${new Date().toLocaleString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  },
};
</script>

