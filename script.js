/* =========================================================
   . . . s a n s a e c o e . . .
   press a small thing, a sheet of paper comes up
   ========================================================= */

(function () {
  var body = document.body;
  var veil = document.getElementById('veil');
  var sheetBody = document.getElementById('sheetBody');
  var closeBtn = document.getElementById('closeBtn');
  var paper = document.querySelector('.paper');
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-sheet]'));
  var opener = null;
  var seq = 0;
  var currentId = null;

  if (!veil || !sheetBody) return;

  /* =========================
     the order window
     the next round of cups is being prepared. while this is true the order
     sheet opens on a short notice instead of the form, and nothing can be
     sent. put it back to false and the whole form is here again, exactly as
     it was — that is the only line to touch.
     ========================= */

  var ORDER_CLOSED = false;

  if (ORDER_CLOSED) document.documentElement.classList.add('is-order-closed');

  /* =========================
     the small counts
     google analytics is on the page, but it may not have arrived (a blocker,
     a slow network). nothing here ever waits on it or breaks without it.
     ========================= */

  function track(name, params) {
    if (typeof window.gtag !== 'function') return;
    try {
      window.gtag('event', name, params || {});
    } catch (err) {}
  }

  /* =========================
     the languages
     ========================= */

  var I18N = window.SANSAECOE_I18N || {};
  var LANGS = ['ko', 'en', 'jp', 'tw'];
  var PAGE_LANG = { ko: 'ko', en: 'en', jp: 'ja', tw: 'zh-Hant' };
  var STORE = 'sansaecoe:lang';

  /* the Korean wording as it is written in index.html */
  var koText = {};
  var koAria = {};
  var koAlt = {};
  var koPlaceholder = {};

  function collect(root) {
    var nodes = root.querySelectorAll('[data-i18n]');
    var i, k;
    for (i = 0; i < nodes.length; i++) {
      k = nodes[i].getAttribute('data-i18n');
      if (!(k in koText)) koText[k] = nodes[i].innerHTML;
    }
    nodes = root.querySelectorAll('[data-i18n-aria]');
    for (i = 0; i < nodes.length; i++) {
      k = nodes[i].getAttribute('data-i18n-aria');
      if (!(k in koAria)) koAria[k] = nodes[i].getAttribute('aria-label') || '';
    }
    nodes = root.querySelectorAll('[data-i18n-alt]');
    for (i = 0; i < nodes.length; i++) {
      k = nodes[i].getAttribute('data-i18n-alt');
      if (!(k in koAlt)) koAlt[k] = nodes[i].getAttribute('alt') || '';
    }
    nodes = root.querySelectorAll('[data-i18n-placeholder]');
    for (i = 0; i < nodes.length; i++) {
      k = nodes[i].getAttribute('data-i18n-placeholder');
      if (!(k in koPlaceholder)) koPlaceholder[k] = nodes[i].getAttribute('placeholder') || '';
    }
  }

  collect(document);
  Array.prototype.forEach.call(document.querySelectorAll('template'), function (tpl) {
    collect(tpl.content);
  });

  function apply(root, lang) {
    var dict = I18N[lang] || {};
    var nodes = root.querySelectorAll('[data-i18n]');
    var i, el, k, v;

    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      k = el.getAttribute('data-i18n');
      v = dict[k];
      el.innerHTML = v != null ? v : koText[k] != null ? koText[k] : el.innerHTML;
    }

    nodes = root.querySelectorAll('[data-i18n-aria]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      k = el.getAttribute('data-i18n-aria');
      v = dict[k];
      el.setAttribute('aria-label', v != null ? v : koAria[k] != null ? koAria[k] : el.getAttribute('aria-label'));
    }

    nodes = root.querySelectorAll('[data-i18n-alt]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      k = el.getAttribute('data-i18n-alt');
      v = dict[k];
      el.setAttribute('alt', v != null ? v : koAlt[k] != null ? koAlt[k] : el.getAttribute('alt'));
    }

    nodes = root.querySelectorAll('[data-i18n-placeholder]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      k = el.getAttribute('data-i18n-placeholder');
      v = dict[k];
      el.setAttribute('placeholder', v != null ? v : koPlaceholder[k] != null ? koPlaceholder[k] : el.getAttribute('placeholder'));
    }
  }

  var lang = 'ko';
  try {
    var saved = window.localStorage.getItem(STORE);
    if (saved && LANGS.indexOf(saved) !== -1) lang = saved;
  } catch (e) {}
  var asked = /[?&]lang=(ko|en|jp|tw)\b/.exec(window.location.search);
  if (asked) lang = asked[1];

  var langBtns = Array.prototype.slice.call(document.querySelectorAll('.lang [data-lang]'));

  function syncSheetLabel() {
    /* the order sheet carries two versions of itself while the next round is
       prepared, and only one of them is on the page */
    var title = sheetBody.querySelector(
      ORDER_CLOSED ? '.order-preparing h2' : '.order-live h2'
    ) || sheetBody.querySelector('h2');
    var sheet = veil.querySelector('.sheet');
    if (title && sheet) sheet.setAttribute('aria-label', title.textContent.trim());
  }

  function setLang(next, persist) {
    if (LANGS.indexOf(next) === -1) next = 'ko';
    lang = next;

    document.documentElement.setAttribute('lang', PAGE_LANG[next] || 'ko');
    document.documentElement.setAttribute('data-lang', next);

    apply(document, next);

    langBtns.forEach(function (btn) {
      var on = btn.getAttribute('data-lang') === next;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.classList.toggle('is-on', on);
    });

    syncSheetLabel();

    if (persist) {
      try {
        window.localStorage.setItem(STORE, next);
      } catch (e) {}
    }
  }

  langBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setLang(btn.getAttribute('data-lang'), true);
    });
  });

  /* the objects settle in, one after another */
  window.setTimeout(function () {
    document.documentElement.classList.add('is-ready');
  }, 60);

  function loadDeferred(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('img[data-src]'), function (img) {
      if (!img.getAttribute('src')) img.setAttribute('src', img.getAttribute('data-src'));
    });
  }

  function open(id, trigger) {
    var tpl = document.getElementById('t-' + id);
    if (!tpl) return;

    /* switching from one sheet to another keeps the thing that opened
       the first one, so closing gives the focus back where it belongs */
    if (trigger) opener = trigger;
    currentId = id;
    seq += 1;

    track('select_content', { content_type: 'sheet', content_id: id });

    sheetBody.innerHTML = '';
    sheetBody.appendChild(tpl.content.cloneNode(true));
    apply(sheetBody, lang);
    loadDeferred(sheetBody);

    /* a soft change of page when one sheet gives way to the next */
    sheetBody.classList.remove('is-swap');
    void sheetBody.offsetWidth;
    sheetBody.classList.add('is-swap');

    syncSheetLabel();
    initOrderSheet(sheetBody);

    veil.hidden = false;
    /* next frame, so the transition runs */
    window.requestAnimationFrame(function () {
      veil.classList.add('is-in');
    });

    if (paper) paper.inert = true;
    body.classList.add('is-locked');
    body.classList.add('has-opened');
    veil.querySelector('.sheet').scrollTop = 0;

    closeBtn.focus({ preventScroll: true });
  }

  function close() {
    veil.classList.remove('is-in');
    body.classList.remove('is-locked');
    if (paper) paper.inert = false;

    currentId = null;
    seq += 1;
    var mySeq = seq;
    window.setTimeout(function () {
      if (seq !== mySeq) return;
      veil.hidden = true;
      sheetBody.innerHTML = '';
    }, 380);

    if (opener) opener.focus({ preventScroll: true });
  }

  items.forEach(function (btn) {
    btn.addEventListener('click', function () {
      open(btn.getAttribute('data-sheet'), btn);
    });
  });

  closeBtn.addEventListener('click', close);

  /* a small thing inside an open sheet that leads to another sheet —
     the second cup, and the way back to the first story */
  sheetBody.addEventListener('click', function (e) {
    var link = e.target && e.target.closest ? e.target.closest('[data-sheet]') : null;
    if (!link || !sheetBody.contains(link)) return;

    var next = link.getAttribute('data-sheet');
    if (!next) return;

    e.preventDefault();
    if (next === currentId) return;
    if (!document.getElementById('t-' + next)) return;
    open(next, null);
  });

  veil.addEventListener('click', function (e) {
    if (e.target === veil) close();
  });

  veil.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !veil.hidden) close();
  });

  /* =========================
     the order form
     the shop's google form, kept inside the sheet — the same questions,
     the same answers, going to the same place
     ========================= */

  var ORDER_POST = 'https://docs.google.com/forms/d/e/1FAIpQLSeknSGQxWfjR5iD-x4sie4q4XCiZseJlDGxMNcZZKh9boSq6g/formResponse';
  var ORDER_VIEW = 'https://docs.google.com/forms/d/1mMFNMiNpouspm8B6GLY-5VleLIEhMdzr4Ll9iw5mAw4/viewform';
  var ORDER_DATE = 'entry.521067999';

  /* the cups and the saucers are counted in one small google sheet, and the
     order sheet asks it how many are left every time it opens. if the answer
     does not come, the form stays exactly as it was — a quiet page, never a
     blocked one. every answer carries the number of cups and of saucers it
     needs (data-cup, data-soser in index.html), and an answer is out when
     either of them has run short. */
  var SAUCER_STOCK_URL = 'https://script.google.com/macros/s/AKfycbzeCNlLJrVlEQUp4l_eP9sj8WH2miva_NGn2MvF1YiJSIynHZDpVm0trXYmZyUDM163sw/exec';
  var SAUCER_STOCK_TIMEOUT = 6000;

  /* the days we cannot hand a cup over: every Wednesday, and now and then
     a day of our own (2026-11-24 was one). add a date here when it comes. */
  var CLOSED_WEEKDAY = 3;
  var CLOSED_DATES = ['2026-11-24'];

  /* the pickup is from the day after the order is written, as the form says */
  var PICKUP_FROM_TOMORROW = true;

  /* and no further ahead than three weeks from today */
  var PICKUP_MAX_DAYS = 21;

  /* one word in the language being read, with the Korean as the floor */
  function T(key, ko) {
    var dict = I18N[lang] || {};
    var v = dict[key];
    return v != null ? v : ko;
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  /* today, moved by a number of days, as the date field wants it */
  function isoAdded(days) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function tomorrowISO() {
    return isoAdded(PICKUP_FROM_TOMORROW ? 1 : 0);
  }

  function latestISO() {
    return isoAdded(PICKUP_MAX_DAYS);
  }

  /* 11월 24일 / 24 Nov / 11月24日 / 11月24日 */
  function shortDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (lang === 'en') return (+m[3]) + ' ' + months[+m[2] - 1];
    if (lang === 'jp' || lang === 'tw') return (+m[2]) + '月' + (+m[3]) + '日';
    return (+m[2]) + '월 ' + (+m[3]) + '일';
  }

  /* why this day cannot be chosen, if it cannot */
  function closedReason(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
    if (CLOSED_DATES.indexOf(iso) !== -1) return 'order.closedDate';
    if (new Date(iso + 'T00:00:00').getDay() === CLOSED_WEEKDAY) return 'order.wed';
    return null;
  }

  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return iso || '';

    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    var days = {
      ko: ['일', '월', '화', '수', '목', '금', '토'],
      en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      jp: ['日', '月', '火', '水', '木', '金', '土'],
      tw: ['日', '一', '二', '三', '四', '五', '六']
    };
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var w = (days[lang] || days.ko)[d.getDay()];

    if (lang === 'en') return w + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    if (lang === 'jp' || lang === 'tw') return m[1] + '年' + (+m[2]) + '月' + (+m[3]) + '日（' + w + '）';
    return m[1] + '년 ' + (+m[2]) + '월 ' + (+m[3]) + '일 (' + w + ')';
  }

  function legacyCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text, done); });
    } else {
      legacyCopy(text, done);
    }
  }

  /* the account number, copied with one small press */
  sheetBody.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('[data-copy]') : null;
    if (!btn || !sheetBody.contains(btn)) return;

    e.preventDefault();
    copyText(btn.getAttribute('data-copy'), function () {
      btn.classList.add('is-done');
      btn.textContent = T('order.copied', '복사했어요');
      window.setTimeout(function () {
        btn.classList.remove('is-done');
        btn.textContent = T('order.copy', '계좌번호 복사');
      }, 1800);
    });
  });

  function initOrderSheet(root) {
    var form = root.querySelector('.order-form');
    if (!form) return;

    /* while the next round is prepared the form is not on the page at all,
       so there is nothing to fill and nothing that could be sent */
    if (ORDER_CLOSED) return;

    var dateEl = form.querySelector('#orderDate');
    var hint = form.querySelector('#orderDateHint');
    var alertEl = form.querySelector('#orderAlert');
    var btn = form.querySelector('.order-submit');
    var minISO = tomorrowISO();
    var maxISO = latestISO();

    /* ---- how many cups and how many saucers are left ---- */

    var itemOpts = Array.prototype.slice.call(
      form.querySelectorAll('input[name="entry.1212348438"]')
    );

    var allOutEl = form.querySelector('#orderStockAll');

    /* what the sheet last said. null means we do not know — an older sheet
       that answers with saucers only leaves the cups exactly as they were */
    var saucerLeft = null;
    var cupLeft = null;
    var allSoldOut = false;

    /* a cup alone needs one cup; the set needs one cup and one saucer; two
       of either needs two */
    function needed(input, attr) {
      var n = parseInt(input.getAttribute(attr) || '0', 10);
      return isNaN(n) ? 0 : n;
    }

    /* a number the sheet sent, or null when it is not a number at all */
    function countOf(v) {
      if (typeof v !== 'number' || !isFinite(v)) return null;
      return Math.max(0, Math.floor(v));
    }

    function markSoldOut(input, soldOut) {
      var label = input.closest ? input.closest('.order-choice') : null;
      var badge = label ? label.querySelector('.order-soldout') : null;
      if (badge) badge.textContent = T('order.soldOut', '(품절)');
      input.disabled = soldOut;
      if (label) label.classList.toggle('is-soldout', soldOut);
      if (soldOut) input.checked = false;
    }

    /* the one place that decides which answers can still be chosen: an
       answer is out when either the cups or the saucers it needs have run
       short, and while no cup is left nothing at all can be chosen */
    function applyStock() {
      allSoldOut = cupLeft !== null && cupLeft <= 0;

      itemOpts.forEach(function (input) {
        var short = false;
        if (cupLeft !== null && cupLeft < needed(input, 'data-cup')) short = true;
        if (saucerLeft !== null && saucerLeft < needed(input, 'data-soser')) short = true;
        markSoldOut(input, short);
      });

      if (allOutEl) allOutEl.classList.toggle('is-on', allSoldOut);
      if (btn) btn.disabled = allSoldOut;
    }

    function soldOutNotice(what) {
      if (what === 'cup') {
        showAlert(
          'order.cupSoldOutAlert',
          '방금 고르신 옵션은 잔이 품절되었어요. 다른 옵션을 골라주세요.',
          false
        );
        return;
      }
      showAlert(
        'order.soldOutAlert',
        '방금 고르신 세트는 소서가 품절되었어요. 다른 옵션을 골라주세요.',
        false
      );
    }

    /* asking the sheet how many are left. each number is used only when it
       really is a number; a slow or broken answer, or an older sheet that
       does not count the cups yet, leaves the form exactly as it was */
    function readStock() {
      if (!SAUCER_STOCK_URL || !window.fetch) return;

      var ctrl = null;
      try {
        if (window.AbortController) ctrl = new AbortController();
      } catch (err) {}
      var timer = window.setTimeout(function () {
        if (ctrl) ctrl.abort();
      }, SAUCER_STOCK_TIMEOUT);

      fetch(SAUCER_STOCK_URL, {
        method: 'GET',
        cache: 'no-store',
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          window.clearTimeout(timer);
          if (!data) return;

          var nextSaucer = countOf(data.saucerRemaining);
          var nextCup = countOf(data.cupRemaining);
          if (nextSaucer === null && nextCup === null) return;

          if (nextSaucer !== null) saucerLeft = nextSaucer;
          if (nextCup !== null) cupLeft = nextCup;

          /* an answer already chosen that has just run out is let go, and a
             small line says so (while no cup is left the line under the
             choices already says all of it) */
          var had = null;
          itemOpts.forEach(function (input) {
            if (input.checked) had = input;
          });

          applyStock();

          if (had && had.disabled && !allSoldOut) {
            var q = qOf(had);
            if (q) q.classList.remove('is-missing');
            soldOutNotice(
              cupLeft !== null && cupLeft < needed(had, 'data-cup') ? 'cup' : 'saucer'
            );
          }
        })
        .catch(function () {
          window.clearTimeout(timer);
        });
    }

    readStock();

    /* from tomorrow on, and never on a day we are closed — a Wednesday, or a
       closing of our own. a day that cannot be kept is cleared at once and
       the small line underneath says why, in the reader's own language. */
    function dateHintText(key, iso) {
      if (key === 'order.tooFar') {
        return T('order.tooFar', '픽업일은 오늘로부터 최대 3주 이내로 골라주세요.');
      }
      if (key === 'order.closedDate') {
        return T('order.closedDate', '{date}은 임시 휴무일이에요. 다른 날짜를 골라주세요.').replace('{date}', shortDate(iso));
      }
      return T(
        'order.wed',
        '수요일은 산새코에 정기 휴점일이에요. 수요일을 제외한 날짜를 골라주세요.'
      );
    }

    function showDateHint(key, iso) {
      if (!hint) return;
      if (!key) {
        hint.classList.remove('is-on');
        return;
      }
      hint.textContent = dateHintText(key, iso);
      hint.classList.add('is-on');
    }

    function checkChosenDate() {
      if (!dateEl) return;
      var v = dateEl.value;

      /* a day we are closed on: the field is emptied at once, and the line
         underneath says why. it stays there until a day we can keep is
         chosen — emptying the field again fires its own event, and that
         must not wipe the words away. */
      /* a day past the three weeks we take orders for: emptied the same way */
      if (v && v > maxISO) {
        dateEl.value = '';
        showDateHint('order.tooFar', v);
        return;
      }

      var reason = closedReason(v);
      if (reason) {
        dateEl.value = '';
        showDateHint(reason, v);
        return;
      }

      if (v) showDateHint(null);
    }

    if (dateEl) {
      dateEl.min = minISO;
      dateEl.max = maxISO;
      dateEl.addEventListener('change', checkChosenDate);
      dateEl.addEventListener('input', checkChosenDate);
    }

    function qOf(el) {
      return el && el.closest ? el.closest('.order-q') : null;
    }

    function showAlert(key, ko, withLink) {
      if (!alertEl) return;
      alertEl.innerHTML = '';
      alertEl.classList.add('is-on');

      var span = document.createElement('span');
      span.textContent = T(key, ko);
      alertEl.appendChild(span);

      if (!withLink) return;
      var a = document.createElement('a');
      a.className = 'order-direct';
      a.href = ORDER_VIEW;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = T('order.direct', '구글 폼에서 직접 작성하기 ↗');
      alertEl.appendChild(a);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* no cup of this round is left: the sheet stays readable, and nothing
         goes out (the line under the choices says why) */
      if (allSoldOut) {
        showAlert(
          'order.soldOutAll',
          '이번에 준비한 히요코 잔이 모두 품절되었어요. 다음 소식을 기다려 주세요.',
          false
        );
        return;
      }

      if (btn.disabled) return;

      var agree = form.querySelector('input[name="entry.513669972"]');
      var item = form.querySelector('input[name="entry.1212348438"]:checked');
      var paid = form.querySelector('input[name="entry.1393246590"]:checked');
      var pack = form.querySelector('input[name="entry.877681113"]:checked');
      var nameEl = form.querySelector('#orderName');
      var phoneEl = form.querySelector('#orderPhone');
      var privacy = form.querySelector('input[name="entry.1072491766"]');

      var dateVal = dateEl ? dateEl.value : '';
      var digits = phoneEl ? phoneEl.value.replace(/[^0-9]/g, '') : '';

      var checks = [
        { q: qOf(agree), ok: !!(agree && agree.checked) },
        /* an answer the stock has run out of must never go out */
        { q: qOf(item), ok: !!item && !item.disabled },
        { q: qOf(paid), ok: !!paid },
        { q: qOf(pack), ok: !!pack },
        { q: qOf(dateEl), ok: /^\d{4}-\d{2}-\d{2}$/.test(dateVal) && dateVal >= minISO && dateVal <= maxISO && !closedReason(dateVal) },
        { q: qOf(nameEl), ok: !!(nameEl && nameEl.value.trim()) },
        { q: qOf(phoneEl), ok: digits.length >= 9 },
        { q: qOf(privacy), ok: !!(privacy && privacy.checked) }
      ];

      var first = null;
      checks.forEach(function (c) {
        if (!c.q) return;
        c.q.classList.toggle('is-missing', !c.ok);
        if (!c.ok && !first) first = c;
      });

      if (first) {
        var key = 'order.alert';
        var ko = '아직 채우지 않은 항목이 있어요. 표시된 곳을 확인해 주세요.';
        if (first.q === qOf(dateEl) && dateVal) {
          var closed = closedReason(dateVal);
          if (dateVal > maxISO) {
            dateEl.value = '';
            showDateHint('order.tooFar', dateVal);
            key = 'order.tooFar';
            ko = dateHintText('order.tooFar', dateVal);
          } else if (closed) {
            dateEl.value = '';
            showDateHint(closed, dateVal);
            key = closed;
            ko = dateHintText(closed, dateVal);
          } else {
            key = 'order.alertDate';
            ko = '희망 픽업일은 내일 이후 날짜로 골라주세요.';
          }
        } else if (first.q === qOf(item) && item && item.disabled) {
          key = 'order.soldOutAlert';
          ko = '고르신 세트는 소서가 품절되었어요. 다른 옵션을 골라주세요.';
        } else if (first.q === qOf(phoneEl) && phoneEl && phoneEl.value.trim()) {
          key = 'order.alertPhone';
          ko = '연락처를 한 번 더 확인해 주세요.';
        }
        showAlert(key, ko, false);
        first.q.scrollIntoView({ block: 'center', behavior: 'smooth' });
        var focusable = first.q.querySelector('input');
        if (focusable) focusable.focus({ preventScroll: true });
        return;
      }

      if (alertEl) alertEl.classList.remove('is-on');

      var fd = new FormData(form);
      var parts = dateVal.split('-');
      fd.append(ORDER_DATE + '_year', String(parseInt(parts[0], 10)));
      fd.append(ORDER_DATE + '_month', String(parseInt(parts[1], 10)));
      fd.append(ORDER_DATE + '_day', String(parseInt(parts[2], 10)));
      fd.append('fvv', '1');
      fd.append('pageHistory', '0');

      var labelEl = item.parentNode.querySelector('span');
      var answers = {
        product: labelEl ? labelEl.textContent.trim() : item.value,
        name: nameEl.value.trim(),
        date: dateVal,
        phone: phoneEl.value.trim()
      };

      var label = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = T('order.sending', '보내는 중…');

      var ctrl = null;
      try {
        if (window.AbortController) ctrl = new AbortController();
      } catch (err) {}
      var timer = window.setTimeout(function () {
        if (ctrl) ctrl.abort();
      }, 15000);

      fetch(ORDER_POST, {
        method: 'POST',
        mode: 'no-cors',
        body: fd,
        signal: ctrl ? ctrl.signal : undefined
      }).then(function () {
        window.clearTimeout(timer);
        track('hiyiko_order_submit', { product: answers.product });
        orderDone(answers);
      }).catch(function () {
        window.clearTimeout(timer);
        btn.disabled = false;
        btn.innerHTML = label;
        showAlert(
          'order.error',
          '주문서가 보내지지 않았어요. 잠시 뒤 다시 한 번 눌러주시거나, 아래 링크로 구글 폼에서 직접 작성해 주세요.',
          true
        );
      });
    });
  }

  /* what the sheet says once the order has gone */
  function orderDone(answers) {
    var wrap = document.createElement('div');
    wrap.className = 'order-done';

    var kick = document.createElement('p');
    kick.className = 'kicker';
    kick.textContent = T('order.doneKicker', '감사합니다 . . .');
    wrap.appendChild(kick);

    var title = document.createElement('h2');
    title.textContent = T('order.doneTitle', '주문서가 접수되었습니다');
    wrap.appendChild(title);

    var facts = document.createElement('div');
    facts.className = 'order-facts';

    [
      [T('order.doneProduct', '구매 상품'), answers.product],
      [T('order.doneName', '입금자명'), answers.name],
      [T('order.doneDate', '희망 픽업일'), formatDate(answers.date)],
      [T('order.donePhone', '연락처'), answers.phone],
      [T('order.pickupK', '수령지'), T('order.pickupV', '서울 강남구 압구정로30길 60, 6층 산새코에')]
    ].forEach(function (pair) {
      var row = document.createElement('div');
      var k = document.createElement('span');
      k.className = 'k';
      k.textContent = pair[0];
      var v = document.createElement('span');
      v.className = 'v';
      v.textContent = pair[1];
      row.appendChild(k);
      row.appendChild(v);
      facts.appendChild(row);
    });
    wrap.appendChild(facts);

    var prose = document.createElement('div');
    prose.className = 'prose';
    var stanza = document.createElement('div');
    stanza.className = 'stanza';
    var note = document.createElement('p');
    note.textContent = T(
      'order.doneNote',
      '입금이 확인되면 남겨주신 연락처로 확인 문자를 드릴게요. 히요코 잔과 함께 해주셔서 정말 감사합니다. 산새코에에서 만나요 !'
    );
    stanza.appendChild(note);
    prose.appendChild(stanza);
    wrap.appendChild(prose);

    var actions = document.createElement('div');
    actions.className = 'actions';
    var done = document.createElement('button');
    done.type = 'button';
    done.className = 'btn';
    done.setAttribute('data-close', '');
    done.style.cursor = 'pointer';
    done.textContent = T('order.doneClose', '확인');
    actions.appendChild(done);
    wrap.appendChild(actions);

    sheetBody.innerHTML = '';
    sheetBody.appendChild(wrap);
    syncSheetLabel();

    var sheet = veil.querySelector('.sheet');
    if (sheet) sheet.scrollTop = 0;
    if (done) done.focus({ preventScroll: true });
  }

  /* =========================
     the first film
     the whole screen is one film; one touch takes it away
     and the sheet of paper is already there underneath
     ========================= */

  var intro = document.getElementById('intro');
  var introVideo = document.getElementById('introVideo');
  var introOpen = false;
  var skipIntro = document.documentElement.classList.contains('skip-intro');

  function endIntro() {
    if (!introOpen) return;
    introOpen = false;

    intro.classList.add('is-out');
    intro.setAttribute('aria-hidden', 'true');
    intro.removeAttribute('role');
    intro.tabIndex = -1;
    body.classList.remove('has-intro');

    if (document.activeElement === intro) intro.blur();

    window.setTimeout(function () {
      intro.hidden = true;
      if (introVideo) {
        try { introVideo.pause(); } catch (e) {}
      }
    }, 700);
  }

  if (intro && !intro.hidden && !skipIntro) {
    introOpen = true;

    /* mobile browsers only play a film on their own when it is silent and inline */
    if (introVideo) {
      introVideo.muted = true;
      var playing = introVideo.play();
      if (playing && typeof playing.catch === 'function') playing.catch(function () {});
      introVideo.addEventListener('error', endIntro);
    }

    intro.addEventListener('click', endIntro);

    /* a tap is a tap — the film goes at the touch, not after the page's own delay */
    intro.addEventListener('touchend', function (e) {
      e.preventDefault();
      endIntro();
    }, { passive: false });

    intro.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        endIntro();
      }
    });

    /* Enter and space work even before anyone has tabbed to the film */
    document.addEventListener('keydown', function (e) {
      if (!introOpen) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        endIntro();
      }
    });
  } else if (intro) {
    intro.setAttribute('aria-hidden', 'true');
    intro.tabIndex = -1;
    if (skipIntro) {
      intro.hidden = true;
      if (introVideo) {
        try { introVideo.pause(); } catch (e) {}
      }
    }
    body.classList.remove('has-intro');
  }

  /* open by hash, e.g. index.html#hiyiko or index.html#t-hiyiko */
  if (window.location.hash) {
    var id = window.location.hash.replace('#', '').replace(/^t-/, '');
    if (document.getElementById('t-' + id)) {
      window.setTimeout(function () { open(id, null); }, 200);
    }
  }

  /* the page starts in Korean unless another language was chosen before */
  setLang(lang, !!asked);
})();
