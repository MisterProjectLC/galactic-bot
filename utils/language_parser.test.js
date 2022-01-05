const language_parser = require('./language_parser').language_parser;

test('initial language parser test', () => {
  expect(language_parser(["quero","ser","feliz!"])).toEqual(['quero','ser','feliz']);
});