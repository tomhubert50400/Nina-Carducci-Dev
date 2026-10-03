const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const test = require('node:test');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');

test('CDN version and integrity match the tested jQuery bundle', () => {
  const dom = new JSDOM(html);
  const script = dom.window.document.querySelector('script[src*="code.jquery.com"]');
  assert.equal(script.src, 'https://code.jquery.com/jquery-3.7.1.min.js');
  const jquery = readFileSync(require.resolve('jquery/dist/jquery.min.js'));
  assert.equal(script.getAttribute('integrity'), `sha256-${createHash('sha256').update(jquery).digest('base64')}`);
  assert.equal(script.crossOrigin, 'anonymous');
  dom.window.close();
});

test('gallery filters, lightbox navigation, dismissal and reopening remain compatible', async (t) => {
  // No remote resources or contact form submission: execute the actual local scripts.
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
  t.after(() => dom.window.close());
  const { window } = dom;
  window.eval(readFileSync(require.resolve('jquery'), 'utf8'));
  const $ = window.jQuery;
  $.fx.off = true;
  for (const script of ['assets/bootstrap/bootstrap.bundle.js', 'assets/maugallery.js', 'assets/scripts.js']) {
    window.eval(read(script));
  }
  await new Promise((resolve) => $(resolve));
  assert.equal($.fn.jquery, '3.7.1');
  assert.notEqual($('.gallery').css('display'), 'none');
  assert.equal($('.item-column .gallery-item').length, 9);
  assert.equal($('.tags-bar .nav-link').length, 5);
  const visible = () => $('.gallery-item').filter(function () { return $(this).parents('.item-column').css('display') !== 'none'; });
  for (const [tag, count] of [['Concert', 2], ['Entreprises', 3], ['Mariages', 2], ['Portrait', 2], ['all', 9]]) {
    const filter = $(`.tags-bar [data-images-toggle="${tag}"]`);
    filter.trigger('click');
    assert.equal(visible().length, count, tag);
    filter.trigger('click');
    assert.equal(visible().length, count, `${tag} repeated click`);
  }
  $('[data-images-toggle="Concert"]').trigger('click');
  const sources = visible().map(function () { return $(this).attr('src'); }).get();
  const modal = $('#myAwesomeLightbox').removeClass('fade');
  const source = () => modal.find('.lightboxImage').attr('src');
  visible().first().trigger('click');
  assert.equal(modal.hasClass('show'), true);
  assert.equal(source(), sources[0]);
  modal.find('.mg-next').trigger('click');
  assert.equal(source(), sources[1]);
  modal.find('.mg-next').trigger('click');
  assert.equal(source(), sources[0]);
  modal.find('.mg-prev').trigger('click');
  assert.equal(source(), sources[1]);
  modal.modal('hide');
  assert.equal(modal.hasClass('show'), false);
  $('[data-images-toggle="all"]').trigger('click');
  visible().last().trigger('click');
  assert.equal(modal.hasClass('show'), true);
  modal.find('.mg-next').trigger('click');
  assert.equal(source(), visible().first().attr('src'));
  modal.modal('hide');
  assert.equal($('.modal-backdrop').length, 0);
});
