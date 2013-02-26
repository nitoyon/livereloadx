var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-1616138-4']);
_gaq.push(['_trackPageview']);

(function(d) {
  var js, fjs=d.getElementsByTagName('script')[0];
  var addScript = function(src, id){
    if(d.getElementById(id)) return;
    js = d.createElement('script');
    js.id = id;
    js.src = src;
    js.async = true;
    fjs.parentNode.insertBefore(js,fjs);
  };

  addScript(('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js');
  addScript('//platform.twitter.com/widgets.js', 'twitter-wjs');
  addScript('//connect.facebook.net/' + (Site.lang == "ja" ? "ja_JP" : "en_US") + '/all.js#xfbml=1&appId=306142992832693', 'facebook-jssdk');

})(document);
