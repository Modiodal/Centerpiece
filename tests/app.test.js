const Application = require('spectron').Application;
const assert = require('assert');
const electronPath = require('electron');
const path = require('path');

describe('Centerpiece app test', function () {
    this.timeout(10000);

    before(function () {
        this.app = new Application({
            path: electronPath,
            args: [path.join(__dirname, '..')]
        });
        return this.app.start()
    });

    after(function () {
        if (this.app && this.app.isRunning()) {
            return this.app.mainProcess.exit(0);
        }
    });

    it('Show only one window', function () {
        return this.app.client.getWindowCount().then(function (count) {
            assert.equal(count, 1)
        }).then(this.app.stop())
    });

    it('Should have the same title', function () {
        return this.app.client.getTitle().then(function (title) {
            assert.equal(title, 'Centerpiece')
        }).then(this.app.stop())
    });

    it('Initial window should show', function () {
        return this.app.client.browserWindow.isVisible().then(function (visible) {
            assert.equal(visible, true)
        }).then(this.app.stop())
    });
});
