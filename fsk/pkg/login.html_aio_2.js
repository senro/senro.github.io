function status(o){if(o.status>=200&&o.status<300)return o;throw new Error(o.statusText)}function json(o){return o.json()}var fetch=require("node_modules/fetch-ie8/fetch");window.app={},window.app.loginUrl="login.html",fetch("config.json",{method:"get",headers:{"Content-Type":"application/json; charset=UTF-8"},body:""}).then(status).then(json).then(function(o){var t=o,n=window.location.protocol+"//",e=window.location.host,i=n+e+t[t.env].apiHost;window.app.apiHost=i,window.configReady&&window.configReady()}).catch(function(o){console.log("request failed",o)});
define("components/utils/ajax.jsx",function(e,t){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}function o(e,t,n,o,i,l,r,u,f){function j(e){if(e.status>=200&&e.status<300)return e;throw new Error(e.statusText)}function m(e){return"json"==r?e.json():e}var r=r||"json",i=i||"post",u=u||!0;u&&"get"==i&&"string"!=typeof t&&(t=s(t));var w=p(e+("get"==i?"?"+t:""),{method:i,headers:d.default({},{"Content-Type":"application/json; charset=UTF-8"},f),body:"post"==i?a.default(t):""}).then(j).then(m).then(function(e){var t=String(e.status||e.resultcode||e.code);new RegExp(t).test(g)?n&&n(e):new RegExp(t).test(b)?window.app.loginUrl?window.location.href=window.app.loginUrl:c.default.warning("没有配置window.app.loginUrl，请手动跳转到登录页"):"function"==typeof l?l&&l(e):c.default.warning((e.detail||e.message||e.msg).substr(0,100)||"请求失败！"),o&&o(e)}).catch(function(e){console.log("request failed",e)});return w}function s(e,t){var t=t||"objToUrl",n=null;if("urlToObj"==t)if("string"==typeof e){var o=e.split("&");n={};for(var s=0;s<o.length;s++){var i=o[s],r=i.split("=")[0],a=i.split("=")[1];n[r]=a}}else console.log("urlToObj方式，data必须为a=x&b=xx格式字符串");else if(n=[],"object"==("undefined"==typeof e?"undefined":l.default(e))){for(var u in e)if(e[u]){var d=u+"="+encodeURIComponent(e[u]);n.push(d)}n=n.join("&")}else console.log("objToUrl方式，data必须为对象！");return n}Object.defineProperty(t,"__esModule",{value:!0});var i=e("node_modules/babel-runtime/helpers/typeof"),l=n(i),r=e("node_modules/babel-runtime/core-js/json/stringify"),a=n(r),u=e("node_modules/babel-runtime/core-js/object/assign"),d=n(u),f=e("node_modules/antd/lib/message/index"),c=n(f);e("node_modules/antd/lib/message/style/index"),window.__disableNativeFetch=!0;var p=e("node_modules/fetch-ie8/fetch"),g="1|200",b="-99|-1";t.default=o});
"use strict";function _interopRequireDefault(e){return e&&e.__esModule?e:{"default":e}}function hasErrors(e){return _keys2.default(e).some(function(t){return e[t]})}var _getPrototypeOf=require("node_modules/babel-runtime/core-js/object/get-prototype-of"),_getPrototypeOf2=_interopRequireDefault(_getPrototypeOf),_classCallCheck2=require("node_modules/babel-runtime/helpers/classCallCheck"),_classCallCheck3=_interopRequireDefault(_classCallCheck2),_createClass2=require("node_modules/babel-runtime/helpers/createClass"),_createClass3=_interopRequireDefault(_createClass2),_possibleConstructorReturn2=require("node_modules/babel-runtime/helpers/possibleConstructorReturn"),_possibleConstructorReturn3=_interopRequireDefault(_possibleConstructorReturn2),_inherits2=require("node_modules/babel-runtime/helpers/inherits"),_inherits3=_interopRequireDefault(_inherits2),_keys=require("node_modules/babel-runtime/core-js/object/keys"),_keys2=_interopRequireDefault(_keys),_react=require("node_modules/react/react"),_react2=_interopRequireDefault(_react),_reactDom=require("node_modules/react-dom/index"),_form=require("node_modules/antd/lib/form/index"),_form2=_interopRequireDefault(_form),_input=require("node_modules/antd/lib/input/index"),_input2=_interopRequireDefault(_input),_icon=require("node_modules/antd/lib/icon/index"),_icon2=_interopRequireDefault(_icon),_button=require("node_modules/antd/lib/button/index"),_button2=_interopRequireDefault(_button),_ajax=require("components/utils/ajax.jsx"),_ajax2=_interopRequireDefault(_ajax);require("node_modules/antd/lib/form/style/index"),require("node_modules/antd/lib/input/style/index"),require("node_modules/antd/lib/icon/style/index"),require("node_modules/antd/lib/button/style/index");var FormItem=_form2.default.Item,LoginForm=function(e){function t(){var e,r,a,l;_classCallCheck3.default(this,t);for(var o=arguments.length,n=Array(o),u=0;o>u;u++)n[u]=arguments[u];return r=a=_possibleConstructorReturn3.default(this,(e=t.__proto__||_getPrototypeOf2.default(t)).call.apply(e,[this].concat(n))),a.handleSubmit=function(e){e.preventDefault(),a.props.form.validateFields(function(e,t){e||_ajax2.default(window.app.apiHost+"auth/sys/login",t,function(){window.location.href="index.html#/home"})})},l=r,_possibleConstructorReturn3.default(a,l)}return _inherits3.default(t,e),_createClass3.default(t,[{key:"componentDidMount",value:function(){this.props.form.validateFields()}},{key:"render",value:function(){var e=this.props.form,t=e.getFieldDecorator,r=e.getFieldsError,a=e.getFieldError,l=e.isFieldTouched,o=l("username")&&a("username"),n=l("password")&&a("password");return _react2.default.createElement("div",{className:"bg"},_react2.default.createElement(_form2.default,{layout:"inline",className:"login-form",onSubmit:this.handleSubmit},_react2.default.createElement("h1",null,_react2.default.createElement("img",{src:"static/images/logo.png",alt:"",className:"logo"}),"IPEG 濟源製造二處表面一廠    數據監控分析系統"),_react2.default.createElement(FormItem,{validateStatus:o?"error":"",help:o||""},t("username",{rules:[{required:!0,message:"請輸入用戶名!"}]})(_react2.default.createElement(_input2.default,{prefix:_react2.default.createElement(_icon2.default,{type:"user",style:{fontSize:13}}),placeholder:"請輸入用戶名"}))),_react2.default.createElement(FormItem,{validateStatus:n?"error":"",help:n||""},t("password",{rules:[{required:!0,message:"請輸入密碼!"}]})(_react2.default.createElement(_input2.default,{prefix:_react2.default.createElement(_icon2.default,{type:"lock",style:{fontSize:13}}),type:"password",placeholder:"請輸入密碼"}))),_react2.default.createElement(FormItem,null,_react2.default.createElement(_button2.default,{type:"primary",htmlType:"submit",disabled:hasErrors(r())},"登錄"))))}}]),t}(_react2.default.Component),WrappedLoginForm=_form2.default.create()(LoginForm),App=function(e){function t(){return _classCallCheck3.default(this,t),_possibleConstructorReturn3.default(this,(t.__proto__||_getPrototypeOf2.default(t)).apply(this,arguments))}return _inherits3.default(t,e),_createClass3.default(t,[{key:"render",value:function(){return _react2.default.createElement(WrappedLoginForm,null)}}]),t}(_react2.default.Component);_reactDom.render(_react2.default.createElement(App,null),document.getElementById("app"));
