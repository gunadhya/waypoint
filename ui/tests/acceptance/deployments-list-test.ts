import { clickable, collection, create, visitable } from 'ember-cli-page-object';
import { currentURL, findAll } from '@ember/test-helpers';
import { module, test } from 'qunit';

import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { setupSession } from 'waypoint/tests/helpers/login';

const url = '/default/microchip/app/wp-bandwidth/deployments';
const redirectUrl = '/default/microchip/app/wp-bandwidth/deployment/seq/'; // concat with length of deployments array in test

const page = create({
  visit: visitable(url),
  list: collection('[data-test-deployment-list] li'),
  destroyedBadges: collection('[data-test-destroyed-badge]'),
  showDestroyed: clickable('[data-test-display-destroyed-button]'),
});

module('Acceptance | deployments list', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupSession(hooks);

  test('visiting deployments page redirects to latest', async function (assert) {
    let project = this.server.create('project', { name: 'microchip' });
    let application = this.server.create('application', { name: 'wp-bandwidth', project });
    this.server.createList('deployment', 3, 'random', { application });

    await page.visit();

    assert.equal(page.list.length, 3);
    assert.equal(currentURL(), redirectUrl + 3);
  });

  test('visiting deployments page with mutable deployments', async function (assert) {
    let project = this.server.create('project', { name: 'microchip' });
    let application = this.server.create('application', { name: 'wp-bandwidth', project });

    let generations = [
      this.server.create('generation', {
        id: 'job-v1',
        initialSequence: 1,
      }),
      this.server.create('generation', {
        id: 'job-v2',
        initialSequence: 4,
      }),
    ];

    this.server.create('deployment', 'random', 'nomad-jobspec', 'days-old-success', {
      application,
      generation: generations[0],
      sequence: 1,
    });
    this.server.create('deployment', 'random', 'nomad-jobspec', 'days-old-success', {
      application,
      generation: generations[0],
      sequence: 2,
      state: 'DESTROYED',
    });
    this.server.create('deployment', 'random', 'nomad-jobspec', 'hours-old-success', {
      application,
      generation: generations[1],
      sequence: 3,
    });
    this.server.create('deployment', 'random', 'nomad-jobspec', 'minutes-old-success', {
      application,
      generation: generations[1],
      sequence: 4,
    });
    this.server.create('deployment', 'random', 'nomad-jobspec', 'seconds-old-success', {
      application,
      generation: generations[1],
      sequence: 5,
    });

    await page.visit();

    assert.equal(page.list.length, 4);

    await page.showDestroyed();

    assert.equal(page.list.length, 5);
    assert.equal(page.destroyedBadges.length, 1);
  });
});
