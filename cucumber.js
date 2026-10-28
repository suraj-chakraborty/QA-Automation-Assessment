const common = {
  requireModule: ['ts-node/register', 'tsconfig-paths/register'],
  require: ['support/**/*.ts', 'steps/**/*.ts'],
  formatOptions: { snippetInterface: 'async-await' },
};

module.exports = {
  default: {
    ...common,
    format: ['progress', 'json:reports/cucumber-report.json', 'html:reports/cucumber-report.html'],
    paths: ['features/**/*.feature'],
    tags: 'not @self-heal-demo',
  },
  smoke: {
    ...common,
    format: ['progress', 'json:reports/cucumber-smoke.json', 'json:reports/cucumber-report.json'],
    paths: ['features/**/*.feature'],
    tags: '@smoke',
  },
  api: {
    ...common,
    format: ['progress', 'json:reports/cucumber-api.json', 'json:reports/cucumber-report.json'],
    paths: ['features/api/**/*.feature', 'features/smoke.feature'],
    tags: '@api',
  },
  ui: {
    ...common,
    format: ['progress', 'json:reports/cucumber-ui.json', 'json:reports/cucumber-report.json'],
    paths: ['features/ui/**/*.feature'],
    tags: '@ui and not @self-heal-demo',
  },
  sql: {
    ...common,
    format: ['progress', 'json:reports/cucumber-sql.json', 'json:reports/cucumber-report.json'],
    paths: ['features/sql/**/*.feature'],
    tags: '@sql',
  },
  selfHeal: {
    ...common,
    format: [
      'progress',
      'json:reports/cucumber-self-heal.json',
      'json:reports/cucumber-report.json',
    ],
    paths: ['features/ui/self-heal-demo.feature'],
    tags: '@self-heal-demo',
  },
};
