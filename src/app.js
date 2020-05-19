// import jquery from 'jquery'
// // import config from 'config'
// import 'popper.js'
// import 'bootstrap'
// import 'mdbootstrap'

// IE polyfill
import URLSearchParams from '@ungap/url-search-params'

// window.jQuery = window.$ = jquery;

const params = new URLSearchParams(location.search);

$('.prefillable').each(function () {
  const param = this.id;
  if (params.has(param)) {
    $(this).val(params.get(param))
  }
})