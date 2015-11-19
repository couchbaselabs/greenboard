angular.module('svc.timeline', [])
  .value('PASS_BAR_STYLE', {x: [], y: [], 
					    type: "bar", name: "Pass",
					    marker: {color: 'rgba(59, 201, 59, 0.70)'}})
  .value('FAIL_BAR_STYLE', {x: [], y: [], 
					    type: "bar", name: "Fail",
					    marker: {color: 'rgba(222, 0, 0, 0.70)'}})
  .value('CHART_LAYOUT', {height: 300, width: 800, title: ""})
  .value('CHART_OPTIONS', {showLink: false, displayLogo: false})
