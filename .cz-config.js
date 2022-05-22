module.exports = {
  types: [
    {
      name: 'feat \t\t✨ 新機能追加',
      value: ':sparkles: feat',
    },
    {
      name: 'fix \t\t🐛 バグ修正',
      value: ':bug: fix',
    },
    {
      name: 'test \t\t✅ テストの追加・修正',
      value: ':white_check_mark: test',
    },
    {
      name: 'refactor \t🔨 リファクタリング',
      value: ':hammer: refactor',
    },
    {
      name: 'style \t🎨 UIの追加・変更',
      value: ':art: style',
    },
    {
      name: 'docs \t\t📝 ドキュメントのみの変更',
      value: ':memo: docs',
    },
    {
      name: 'hint \t\t💡 コメントのみの変更',
      value: ':bulb: hint',
    },
    {
      name: 'perf \t\t⚡ パフォーマンス改善',
      value: ':zap: perf',
    },
    {
      name: 'config \t🔧 補助ツールやライブラリの変更',
      value: ':wrench: config',
    },
  ],
  skipQuestions: ['footer'],
  scopes: ['check', 'validator', 'config'],
  allowCustomScopes: true,
  subjectLimit: 100,
};
