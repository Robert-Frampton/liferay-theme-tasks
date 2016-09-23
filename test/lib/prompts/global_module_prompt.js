'use strict';

var _ = require('lodash');
var gutil = require('gulp-util');
var sinon = require('sinon');
var test = require('ava');

var testUtil = require('../../util.js');

var GlobalModulePrompt;
var ModulePrompt;
var themeFinder;

var prototypeMethodSpy = new testUtil.PrototypeMethodSpy();

var initCwd = process.cwd();

test.cb.before(function(t) {
	testUtil.copyTempTheme({
		namespace: 'global_module_prompt'
	}, function(config) {
		GlobalModulePrompt = require('../../../lib/prompts/global_module_prompt.js');
		ModulePrompt = require('../../../lib/prompts/module_prompt.js');
		themeFinder = require('liferay-theme-finder');

		t.end();
	});
});

test.after(function() {
	process.chdir(initCwd);

	testUtil.cleanTempTheme('base-theme', '7.0', 'global_module_prompt');
});

var prototype;

test.beforeEach(function() {
	prototype = _.create(GlobalModulePrompt.prototype);
});

test.afterEach(function() {
	prototypeMethodSpy.flush();
});

test('constructor should pass arguments to init', function(t) {
	var initSpy = prototypeMethodSpy.add(GlobalModulePrompt.prototype, 'init');

	new GlobalModulePrompt({}, _.noop);

	t.true(initSpy.calledWith({}, _.noop));
});

test('init should assign callback as done property and invoke prompting', function(t) {
	prototype._getGlobalModules = sinon.spy();
	var initSpy = prototypeMethodSpy.add(ModulePrompt.prototype, 'init');

	prototype.init({
		selectedModules: ['module'],
		themelet: true
	}, _.noop);

	var cb = prototype._getGlobalModules.getCall(0).args[0];

	cb('modules');

	// TODO assert that initSpy is called with correct args
	t.true(initSpy.calledOnce);
	t.deepEqual(prototype.selectedModules, ['module']);
	t.is(prototype.modules, 'modules');
	t.is(prototype.done, _.noop);
	t.is(prototype.themelet, true);
});

test('_afterPrompt should log message if no modules are found', function(t) {
	prototype.done = sinon.spy();

	var logSpy = prototypeMethodSpy.add(gutil, 'log');

	prototype._afterPrompt({});

	t.true(/No globally installed/.test(logSpy.getCall(0).args[0]));

	t.true(prototype.done.calledWith({}));
});

test('_getGlobalModules should invoke themeFinder.find', function(t) {
	var findSpy = prototypeMethodSpy.add(themeFinder, 'find');

	prototype.themelet = 'themelet';

	prototype._getGlobalModules(_.noop);

	t.true(findSpy.calledWith({
		globalModules: true,
		themelet: 'themelet'
	}, _.noop));
});
