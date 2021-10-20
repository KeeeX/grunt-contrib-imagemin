const fs = require('node:fs');
const path = require('node:path');
const test = require('ava');

const fixture = path.join.bind(path, __dirname, 'fixtures');
const makeTemporaryPath = path.join.bind(path, __dirname, '..', 'tmp');

test('minify png', t => {
	const original = fs.readFileSync(fixture('test.png'));
	const actual = fs.readFileSync(makeTemporaryPath('test.png'));

	t.true(actual.length < original.length);
});

test('minify uppercase png', t => {
	const original = fs.readFileSync(fixture('test-uppercase.PNG'));
	const actual = fs.readFileSync(makeTemporaryPath('test-uppercase.PNG'));

	t.true(actual.length < original.length);
});

test('minify jpg', t => {
	const original = fs.readFileSync(fixture('test.jpg'));
	const actual = fs.readFileSync(makeTemporaryPath('test.jpg'));

	t.true(actual.length < original.length);
});

test('minify uppercase jpg', t => {
	const original = fs.readFileSync(fixture('test-uppercase.JPG'));
	const actual = fs.readFileSync(makeTemporaryPath('test-uppercase.JPG'));

	t.true(actual.length < original.length);
});

test('minify gif', t => {
	const original = fs.readFileSync(fixture('test.gif'));
	const actual = fs.readFileSync(makeTemporaryPath('test.gif'));

	t.true(actual.length < original.length);
});

test('minify uppercase gif', t => {
	const original = fs.readFileSync(fixture('test-uppercase.GIF'));
	const actual = fs.readFileSync(makeTemporaryPath('test-uppercase.GIF'));

	t.true(actual.length < original.length);
});

test('nested directories', t => {
	t.true(fs.existsSync(makeTemporaryPath('nested', 'nested', 'test.png')));
});

test('rename', t => {
	t.true(fs.existsSync(makeTemporaryPath('rename.jpg')));
});
