/* main.js: skrip interaktif situs GreenLife (jQuery dan Bootstrap 3) */
(function ($) {
  'use strict';

  var fmt = function (n, d) {
    return Number(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  };

  /* Navbar menjadi solid saat digulir; tombol kembali ke atas ditampilkan */
  var $nav = $('#gl-navbar'), $top = $('#to-top');
  function onScroll() {
    var y = $(window).scrollTop();
    $nav.toggleClass('scrolled', y > 40);
    $top.toggleClass('show', y > 600);
  }
  $(window).on('scroll', onScroll); onScroll();

  /* Pengguliran halus dengan penyesuaian tinggi navbar */
  $('a[href^="#"]').on('click', function (e) {
    var id = $(this).attr('href');
    if (id.length < 2 || $(this).attr('data-toggle')) return;
    var $t = $(id);
    if (!$t.length) return;
    e.preventDefault();
    var off = id === '#beranda' ? 0 : $t.offset().top - 62;
    $('html, body').animate({ scrollTop: off }, 650);
    $('#gl-menu').collapse('hide');
  });

  /* Kemunculan elemen saat digulir dan animasi hitung angka */
  function countUp(el) {
    var $el = $(el), end = parseFloat($el.data('count')), dec = parseInt($el.data('dec') || 0, 10);
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      $el.text(fmt(end * e, dec));
      if (p < 1) requestAnimationFrame(step); else $el.text(fmt(end, dec));
    }
    requestAnimationFrame(step);
  }
  function reveal(el) {
    $(el).addClass('in').find('[data-count]').each(function () { countUp(this); });
  }
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(reveal);
  }

  $('#year').text(new Date().getFullYear());

  /* Mini game pemilahan sampah */
  var BANK = [
    ['Kulit pisang', 'organik'], ['Sisa nasi & lauk', 'organik'], ['Daun kering', 'organik'], ['Ampas kopi', 'organik'],
    ['Botol plastik minuman', 'anorganik'], ['Kardus', 'anorganik'], ['Kaleng bekas', 'anorganik'], ['Botol kaca', 'anorganik'],
    ['Baterai bekas', 'b3'], ['Lampu neon bekas', 'b3'], ['Obat kedaluwarsa', 'b3'],
    ['Popok sekali pakai', 'residu'], ['Styrofoam kotor', 'residu'], ['Kemasan sachet', 'residu'], ['Puntung rokok', 'residu']
  ];
  var ACTION = {
    organik: 'Olah jadi kompos atau pakan maggot.',
    anorganik: 'Bilas, keringkan, lalu setor ke Bank Sampah.',
    b3: 'Kemas terpisah dan serahkan ke drop box B3.',
    residu: 'Buang ke tempat sampah umum untuk diangkut ke TPS.'
  };
  var NAME = { organik: 'Organik', anorganik: 'Anorganik', b3: 'B3 Rumah Tangga', residu: 'Residu' };
  var N = 8, round = [], idx = 0, score = 0, locked = false;

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function startGame() {
    round = shuffle(BANK.slice()).slice(0, N); idx = 0; score = 0; locked = false;
    $('#g-total').text(N); $('#g-restart').hide(); $('.game-btns').show(); render();
  }
  function render() {
    $('#g-score').text(score); $('#g-no').text(idx + 1);
    $('#g-item').text(round[idx][0]); $('#g-fb').text('').removeClass('ok bad');
    locked = false;
  }
  $('.game-btns button').on('click', function () {
    if (locked) return; locked = true;
    var pick = $(this).data('cat'), ans = round[idx][1], $fb = $('#g-fb');
    if (pick === ans) { score++; $fb.addClass('ok').text('Benar! ' + NAME[ans] + ' — ' + ACTION[ans]); }
    else { $fb.addClass('bad').text('Belum tepat. Seharusnya ' + NAME[ans] + ' — ' + ACTION[ans]); }
    $('#g-score').text(score);
    setTimeout(function () {
      idx++;
      if (idx < N) { render(); }
      else {
        $('#g-item').text('Selesai! 🎉');
        $('#g-fb').removeClass('bad').addClass('ok').text('Skor akhir kamu ' + score + ' dari ' + N + (score >= 7 ? ' — kamu sudah jago memilah!' : ' — coba lagi untuk lebih hafal.'));
        $('.game-btns').hide(); $('#g-restart').show();
      }
    }, 1900);
  });
  $('#g-restart').on('click', startGame);
  startGame();

  /* Eco Calculator */
  var EF_LISTRIK = 0.95; // Faktor emisi listrik grid Sulselbar (kg CO2/kWh), Kepmen ESDM 163.K/2021
  var COL = { l: '#F2C14E', t: '#B6DE8F', f: '#7CC4E8' };

  function val(sel) { var v = parseFloat($(sel).val()); return isFinite(v) && v > 0 ? v : 0; }

  function calculate() {
    var listrik = val('#in-listrik') * EF_LISTRIK;
    var trans = val('#in-km') * parseFloat($('#in-kendaraan').val());
    var food = 0, sapi = val('#f-sapi');
    $('.food').each(function () { food += val(this) * parseFloat($(this).data('f')); });
    var total = listrik + trans + food;

    $('#r-total').text(fmt(total, 2));
    $('#l-listrik').text(fmt(listrik, 2)); $('#l-trans').text(fmt(trans, 2)); $('#l-food').text(fmt(food, 2));
    var pc = function (x) { return total > 0 ? (x / total * 100) : 0; };
    $('#b-listrik').css('width', pc(listrik) + '%'); $('#b-trans').css('width', pc(trans) + '%'); $('#b-food').css('width', pc(food) + '%');

    var html = '';
    if (total > 0) {
      var parts = [['listrik', listrik], ['transportasi', trans], ['makanan', food]].sort(function (a, b) { return b[1] - a[1]; });
      html += '<div class="reco top"><b>Penyumbang terbesar:</b> ' + parts[0][0] + ' (' + fmt(pc(parts[0][1]), 0) + '% dari total harianmu).</div>';
      if (sapi > 0) {
        var save = sapi * (99.48 - 3.16);
        html += '<div class="reco top"><b>Simulasi:</b> mengganti ' + fmt(sapi, 2) + ' kg daging sapi dengan tahu menghemat sekitar ' + fmt(save, 2) + ' kg CO₂e per hari.</div>';
      }
    }
    $('#r-top').html(html);
  }

  $('#calc input, #calc select').on('input change', calculate);
  $('#btn-hitung').on('click', function () {
    calculate();
    if ($(window).width() < 992) $('html, body').animate({ scrollTop: $('#result').offset().top - 80 }, 500);
  });
  $('#btn-contoh').on('click', function () {
    $('#in-listrik').val(6); $('#in-kendaraan').val('0.11367'); $('#in-km').val(12);
    $('#f-sapi').val(0.1); $('#f-ayam').val(0.1); $('#f-beras').val(0.2); $('#f-tahu').val(0.1); $('#f-buah').val(0.2);
    calculate();
  });
  $('#btn-reset').on('click', function () {
    $('#calc')[0].reset(); calculate();
  });
  calculate();

  /* Pencarian bank sampah terdekat berdasarkan lokasi pengguna */
  (function () {
    var $map = $('#map'), $msg = $('#loc-msg'), $btn = $('#btn-locate');
    var label = '📡 Cari Bank Sampah Terdekat dari Lokasi Saya';
    $btn.on('click', function () {
      if (!navigator.geolocation) { $msg.text('Browser kamu belum mendukung deteksi lokasi.'); return; }
      $btn.prop('disabled', true).text('⏳ Mencari lokasimu…');
      $msg.text('');
      navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = pos.coords.latitude, lng = pos.coords.longitude;
        $map.attr('src', 'https://maps.google.com/maps?q=bank+sampah&ll=' + lat + ',' + lng + '&z=14&output=embed');
        var url = 'https://www.google.com/maps/search/bank+sampah/@' + lat + ',' + lng + ',15z';
        $msg.html('Peta menampilkan bank sampah di sekitarmu. <a href="' + url + '" target="_blank" rel="noopener" style="color:#B6DE8F;text-decoration:underline">Buka di Google Maps untuk rute</a>');
        $btn.prop('disabled', false).text(label);
        document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, function (err) {
        var t = { 1: 'Izin lokasi ditolak. Aktifkan izin lokasi di browser lalu coba lagi.', 2: 'Lokasi tidak ditemukan. Coba lagi.', 3: 'Waktu habis. Coba lagi.' };
        $msg.text(t[err.code] || 'Gagal mengambil lokasi.');
        $btn.prop('disabled', false).text(label);
      }, { enableHighAccuracy: true, timeout: 10000 });
    });
  })();

  /* Navigasi menu dengan keyboard: tombol panah, Esc, dan Alt+M */
  (function () {
    var $links = $('#gl-menu .navbar-nav > li > a');
    if (!$links.length) return;
    $('#gl-menu').on('keydown', 'a', function (e) {
      var i = $links.index(this), n = $links.length, k = e.key, to = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % n;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i - 1 + n) % n;
      else if (k === 'Home') to = 0;
      else if (k === 'End') to = n - 1;
      else if (k === 'Escape') { $('#gl-menu').collapse('hide'); $(this).blur(); return; }
      if (to > -1) { e.preventDefault(); $links.eq(to).focus(); }
    });
    $(document).on('keydown', function (e) {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        if (!$('#gl-menu').hasClass('in') && $('.navbar-toggle').is(':visible')) $('#gl-menu').collapse('show');
        $links.first().focus();
      }
    });
  })();

  /* Efek kursor (perangkat dengan mouse; nonaktif jika pengguna memilih gerakan berkurang) */
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canHover && !calm) {
    // Kemiringan kartu mengikuti posisi kursor
    $('.bento, .fcard, .imp, .bin, .prod, .pillar, .member, .study').on('mousemove', function (e) {
      var r = this.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      this.style.transition = 'transform .12s ease-out';
      this.style.transform = 'perspective(900px) rotateX(' + (-y * 4) + 'deg) rotateY(' + (x * 4) + 'deg) translateY(-4px)';
    }).on('mouseleave', function () {
      this.style.transition = 'transform .4s ease';
      this.style.transform = '';
    });
    // Tombol bergeser mengikuti arah kursor
    $('.btn-gl').on('mousemove', function (e) {
      var r = this.getBoundingClientRect();
      this.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.12) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.2) + 'px)';
    }).on('mouseleave', function () { this.style.transform = ''; });
  }

})(jQuery);
