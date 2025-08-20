type Locale = 'en' | 'zh'

const localeEnv = process.env.NEXT_PUBLIC_LOCALE
export const locale: Locale = localeEnv === 'zh' ? 'zh' : 'en'

type Dictionary = Record<string, string>

const en: Dictionary = {
  // Common
  'company.adminLogin': 'Admin Login',
  'company.adminPanel': 'Admin Panel',
  'common.dashboard': 'Dashboard',
  'common.manageMembers': 'Manage Members',
  'common.manageTeams': 'Manage Teams',
  'common.logout': 'Logout',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.add': 'Add',
  'common.members': 'Members',
  'common.team': 'Team',
  'common.member': 'Member',
  'common.description': 'Description',
  'common.unitPrice': 'Unit Price',
  'common.quantity': 'Quantity',
  'common.totalAmount': 'Total Amount',
  'common.date': 'Date',
  'common.currentMonth': 'Current Month',
  'common.historical': '(Historical)',
  'common.previousMonth': 'Previous month',
  'common.nextMonth': 'Next month',

  // Dashboard
  'dashboard.title': 'Budget Tracker',
  'dashboard.subtitle': 'Monitor team spending and budget allocation (Beijing Time UTC+8)',
  'dashboard.totalBudget': 'Total Budget',
  'dashboard.totalSpent': 'Total Spent',
  'dashboard.remaining': 'Remaining',
  'dashboard.members': 'Members',
  'dashboard.teamOverview': 'Team Overview',

  // Team Card
  'team.budget': 'Budget',
  'team.spent': 'Spent',
  'team.remaining': 'Remaining',
  'team.budgetUsage': 'Budget Usage',
  'team.showMembers': 'Show Members',
  'team.hideMembers': 'Hide Members',
  'team.expenses': 'Expenses',
  'team.hideDetails': 'Hide Details',
  'team.showDetails': 'Show Details',
  'team.noExpenses': 'No expenses recorded yet',
  'team.clearFilter': 'Clear filter',
  'team.calculation': 'Calculation:',

  // Admin
  'admin.addExpenditure': 'Add Expenditure',
  'admin.expenditures': 'Expenditures',
  'admin.budgetManagement': 'Budget Management',
  'admin.viewDashboard': 'View Dashboard',
  'admin.signIn': 'Sign In',
  'admin.username': 'Username',
  'admin.password': 'Password',
  'admin.editExpenditure': 'Edit Expenditure',
  'admin.editTeamBudget': 'Edit Team Budget',
  'admin.monthlyBudget': 'Monthly Budget (U)',
  'admin.updateBudget': 'Update Budget',
  'admin.saveExpenditure': 'Save Expenditure',

  // Member Management
  'members.title': 'Member Management',
  'members.selectTeam': 'Select Team',
  'members.addNew': 'Add New Member',
  'members.placeholderName': 'Member name',
  'members.teamMembers': 'Team Members',
  'members.noMembers': 'No members yet. Add your first member above.',

  // Team Management
  'teams.title': 'Team Management',
  'teams.addTeam': 'Add Team',
  'teams.addNewTeam': 'Add New Team',
  'teams.teamName': 'Team Name',
  'teams.teamBudgetOptional': 'Team Budget (optional)',
  'teams.teamColor': 'Team Color',
  'teams.createTeam': 'Create Team',
  'teams.manageMembers': 'Manage Members',
  'teams.editName': 'Edit Name',
  'teams.deleteTeam': 'Delete Team',
  'teams.noMembersInTeam': 'No members in this team',
  'teams.move': 'Move',
  'teams.remove': 'Remove',
  'teams.moveToTeam': 'Move to team:',
  'teams.selectTeam': 'Select a team',
  'teams.moveMember': 'Move Member',
}

const zh: Dictionary = {
  // Common
  'company.adminLogin': '管理员登录',
  'company.adminPanel': '管理后台',
  'common.dashboard': '仪表盘',
  'common.manageMembers': '成员管理',
  'common.manageTeams': '团队管理',
  'common.logout': '退出登录',
  'common.save': '保存',
  'common.cancel': '取消',
  'common.edit': '编辑',
  'common.delete': '删除',
  'common.add': '添加',
  'common.members': '成员',
  'common.team': '团队',
  'common.member': '成员',
  'common.description': '描述',
  'common.unitPrice': '单价',
  'common.quantity': '数量',
  'common.totalAmount': '总金额',
  'common.date': '日期',
  'common.currentMonth': '当前月份',
  'common.historical': '（历史）',
  'common.previousMonth': '上个月',
  'common.nextMonth': '下个月',

  // Dashboard
  'dashboard.title': '预算看板',
  'dashboard.subtitle': '监控团队开支与预算分配（北京时间 UTC+8）',
  'dashboard.totalBudget': '总预算',
  'dashboard.totalSpent': '已花费',
  'dashboard.remaining': '剩余',
  'dashboard.members': '成员数',
  'dashboard.teamOverview': '团队总览',

  // Team Card
  'team.budget': '预算',
  'team.spent': '已花费',
  'team.remaining': '剩余',
  'team.budgetUsage': '预算使用率',
  'team.showMembers': '展开成员',
  'team.hideMembers': '收起成员',
  'team.expenses': '支出',
  'team.hideDetails': '收起明细',
  'team.showDetails': '展开明细',
  'team.noExpenses': '暂无支出记录',
  'team.clearFilter': '清除筛选',
  'team.calculation': '计算：',

  // Admin
  'admin.addExpenditure': '新增支出',
  'admin.expenditures': '支出记录',
  'admin.budgetManagement': '预算管理',
  'admin.viewDashboard': '查看看板',
  'admin.signIn': '登录',
  'admin.username': '用户名',
  'admin.password': '密码',
  'admin.editExpenditure': '编辑支出',
  'admin.editTeamBudget': '编辑团队预算',
  'admin.monthlyBudget': '月度预算（U）',
  'admin.updateBudget': '更新预算',
  'admin.saveExpenditure': '保存支出',

  // Member Management
  'members.title': '成员管理',
  'members.selectTeam': '选择团队',
  'members.addNew': '新增成员',
  'members.placeholderName': '成员名称',
  'members.teamMembers': '团队成员',
  'members.noMembers': '暂无成员，请先新增。',

  // Team Management
  'teams.title': '团队管理',
  'teams.addTeam': '添加团队',
  'teams.addNewTeam': '新增团队',
  'teams.teamName': '团队名称',
  'teams.teamBudgetOptional': '团队预算（可选）',
  'teams.teamColor': '团队颜色',
  'teams.createTeam': '创建团队',
  'teams.manageMembers': '管理成员',
  'teams.editName': '编辑名称',
  'teams.deleteTeam': '删除团队',
  'teams.noMembersInTeam': '该团队暂无成员',
  'teams.move': '移动',
  'teams.remove': '移除',
  'teams.moveToTeam': '移动到团队：',
  'teams.selectTeam': '选择团队',
  'teams.moveMember': '移动成员',
}

const dictByLocale: Record<Locale, Dictionary> = { en, zh }

export function t(key: string): string {
  const dict = dictByLocale[locale]
  return dict[key] ?? key
}

export const monthNamesByLocale: Record<Locale, string[]> = {
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  zh: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
}


