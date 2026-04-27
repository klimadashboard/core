(function () {
	'use strict';

	// Store all iframes by chartId for message handling
	var iframeMap = {};

	// Single global message listener for all embeds
	window.addEventListener('message', function (event) {
		console.log('[Klimadashboard] Received message:', event.data);
		if (event.data && event.data.type === 'klimadashboard-resize' && event.data.chartId) {
			console.log('[Klimadashboard] Looking for iframe with chartId:', event.data.chartId);
			console.log('[Klimadashboard] iframeMap keys:', Object.keys(iframeMap));
			var iframe = iframeMap[event.data.chartId];
			if (iframe && event.data.height > 0) {
				console.log('[Klimadashboard] Resizing iframe to:', event.data.height);
				iframe.style.height = event.data.height + 'px';
			} else {
				console.log('[Klimadashboard] Iframe not found or invalid height');
			}
		}
	});

	function init() {
		var scripts = document.querySelectorAll('script[data-chart]');

		scripts.forEach(function (script) {
			if (script.dataset.processed) return;
			script.dataset.processed = 'true';

			var chartId = script.dataset.chart;
			var targetId = script.dataset.target;

			if (!chartId || !targetId) return;

			var target = document.getElementById(targetId);
			if (!target) {
				console.warn('[Klimadashboard] Target element not found:', targetId);
				return;
			}

			var scriptSrc = script.src;
			var baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));
			var embedUrl = baseUrl + '/embed/' + chartId + '?auto=true';

			// Forward all data-* attributes (except reserved ones) as URL parameters
			var reservedAttrs = ['chart', 'target', 'processed'];
			Object.keys(script.dataset).forEach(function (key) {
				if (reservedAttrs.indexOf(key) === -1 && script.dataset[key]) {
					embedUrl += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(script.dataset[key]);
				}
			});

			var iframe = document.createElement('iframe');
			iframe.src = embedUrl;
			iframe.id = 'kd-iframe-' + chartId + '-' + Math.random().toString(36).slice(2, 6);
			iframe.style.cssText = 'width:100%;border:none;display:block;min-height:400px;';
			iframe.setAttribute('loading', 'lazy');
			iframe.setAttribute('allowfullscreen', '');

			// Store reference for message handling
			iframeMap[chartId] = iframe;

			target.appendChild(iframe);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
