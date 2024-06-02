export const LANGUAGES = {
	de: 'Deutsch',
	en: 'English',
	es: 'Español',
	fr: 'Français',
	it: 'Italiano',
	ja: '日本語',
	ko: '한국어',
	th: 'ไทย',
	vi: 'Tiếng Việt',
	'zh-CN': '简体中文',
	'zh-TW': '繁體中文',
};

type Locale = {
	days: string[];
	daysShort: string[];
	daysMin: string[];
	months: string[];
	monthsShort: string[];
	titleFormat: string;
	format: string;
}

export const LOCALES: { [key: string]: Locale } = {
	// Deutsch
	de: {
		days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
		daysShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
		daysMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
		months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
		monthsShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
		titleFormat: 'MM y',
		format: 'dd.mm.yyyy'
	},
	// English
	en: {
		days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
		months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		titleFormat: 'MM y',
		format: 'mm/dd/yyyy',
	},
	// Español
	es: {
		days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
		daysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
		daysMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
		months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
		monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
		titleFormat: 'MM y',
		format: 'dd/mm/yyyy'
	},
	// Français
	fr: {
		days: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
		daysShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
		daysMin: ['d', 'l', 'ma', 'me', 'j', 'v', 's'],
		months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
		monthsShort: ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
		titleFormat: 'MM y',
		format: 'dd/mm/yyyy',
	},
	// Italiano
	it: {
		days: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
		daysShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
		daysMin: ['Do', 'Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa'],
		months: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
		monthsShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
		titleFormat: 'MM y',
		format: 'dd/mm/yyyy'
	},
	// 日本語
	ja: {
		days: ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'],
		daysShort: ['日', '月', '火', '水', '木', '金', '土'],
		daysMin: ['日', '月', '火', '水', '木', '金', '土'],
		months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
		monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
		titleFormat: 'y年mm月',
		format: 'yyyy/mm/dd',
	},
	// 한국어
	ko: {
		days: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
		daysShort: ['일', '월', '화', '수', '목', '금', '토'],
		daysMin: ['일', '월', '화', '수', '목', '금', '토'],
		months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
		monthsShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
		titleFormat: 'y년mm월',
		format: 'yyyy-mm-dd',
	},
	// ไทย
	th: {
		days: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'],
		daysShort: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'],
		daysMin: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'],
		months: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
		monthsShort: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
		titleFormat: 'MM y',
		format: 'yyyy-mm-dd',
	},
	// Tiếng Việt
	vi: {
		days: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
		daysShort: ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
		daysMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
		months: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
		monthsShort: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
		titleFormat: 'MM y',
		format: 'dd/mm/yyyy'
	},
	// 简体中文
	'zh-CN': {
		days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
		daysShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
		daysMin: ['日', '一', '二', '三', '四', '五', '六'],
		months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
		monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
		titleFormat: 'y年mm月',
		format: 'yyyy-mm-dd',
	},
	// 繁體中文
	'zh-TW': {
		days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
		daysShort: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'],
		daysMin: ['日', '一', '二', '三', '四', '五', '六'],
		months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
		monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
		titleFormat: 'y年mm月',
		format: 'yyyy/mm/dd',
	},
};
