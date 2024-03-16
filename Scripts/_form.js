
Date.prototype.toString = function () {
    return [this.getFullYear(), this.getMonth() + 1, this.getDate()].join("-")
        + 'T' + [this.getHours(), this.getMinutes(), this.getSeconds()].join(':');
}
class MyDateTime {
    _fullNumber(i) {
        let v = this._items[i];
        return v < 10 ? '0' + v : v;
    }
    _items = [];

    constructor(d) {
        if (!d) {
            d = new Date().toString();
        }
        d = d.trim() + '\n';

        let a = 0, i = 0;
        let v = this._items;

        for (let s of d) {
            let c = s.charCodeAt(0);

            if (c < 0x30 || c > 0x39) {
                v[i++] = a;
                a = 0;

            } else {
                a = (a << 1) + (a << 3) + (c & 15);
            }
        }

        if (v[2] > 100) {
            let t = v[0]; v[0] = v[2]; v[2] = t;
        }
        while (i < v.length) {
            v[i++] = 0;
        }
    }

    get day() {
        return this._fullNumber(2);
    }
    get month() {
        return this._fullNumber(1);
    }
    get year() { return this._items[0]; }

    get quarter() { return (this._items[1] >> 2) + 1 }

    get hour() { return this._fullNumber(3) }
    get minute() { return this._fullNumber(4) }
    get second() { return this._fullNumber(5) }
    get date() { return this.day + '/' + this.month + '/' + this.year }
    get time() { return this.hour + ':' + this.minute }
    get fullTime() { return this.time + ':' + this.second }
    toString() {
        return this.date + ' ' + this.fullTime;
    }
}
class MyDate extends MyDateTime {
    constructor(d) {
        super(d);
    }

    add(days) {
        let y = this._items[0];
        let m = this._items[1] - 1;
        let d = this._items[2] + days

        let n = new Date(y, m, d);
        return new MyDate(n.toString())
    }
    toString() { return this.date }
}
class MyInt {
    constructor(v) {
        this.value = "";

        if (!v) return;

        if (typeof v === "string") {
            let a = 0, i = 0;
            if (v[0] == '-')
                i = 1;

            for (; i < v.length; i++) {
                let c = v.charCodeAt(i);
                if (c == '.') break;

                if (c >= 0x30 && 0x39 >= c)
                    a = a * 10 + (c & 15);
            }
            if (v[0] == '-') a = -a;
            this.value = a;
        }
        else {
            this.value = Math.round(v);
        }
    }

    toString() {
        function thou(n) {
            if (n < 10) return "00" + n;
            return (n < 100 ? '0' + n : n);
        }
        let stk = [];
        let v = this.value;
        if (v < 0) v = -v;
        do {
            stk.push(v % 1000);
            v = Math.floor(v / 1000);

        } while (v);

        let s = stk.pop();
        while (stk.length) {
            s += ',' + thou(stk.pop());
        }

        if (this.value < 0) s = '-' + s;
        return s;
    }

    static don_vi = [
        "không",
        "một",
        "hai",
        "ba",
        "bốn",
        "năm",
        "sáu",
        "bảy",
        "tám",
        "chín",
        "mười",
        "linh",
        "mốt",
        null,
        "tư",
        "lăm",
    ];
    static chuc = ["mươi", "trăm"]
    static hang = [null, "nghìn", "triệu", "tỷ"]

    one_thousand(v, first = false) {
        let d, c, t;

        d = v % 10; v = Math.floor(v / 10);
        c = v % 10; t = Math.floor(v / 10);

        let s = [];

        if (t != 0 || first == false) {
            s.push(MyInt.don_vi[t] + ' ' + MyInt.chuc[1]);
            if (c == 0 && d == 0) {
                return s[0];
            }
        }

        switch (c) {
            case 0:
                if (!first || s.length > 0) {
                    s.push(MyInt.don_vi[11]);
                }
                break;

            case 1:
                s.push(MyInt.don_vi[10]);
                break;

            default:
                s.push(MyInt.don_vi[c]);
                s.push(MyInt.chuc[0]);
                break;
        }

        if (d != 0) {
            switch (d) {
                case 1:
                    if (c > 1) d += 11;
                    break;

                case 4:
                    if (c != 1) d += 10;
                    break;

                case 5:
                    if (c != 0) d += 10;
                    break;
            }
            s.push(MyInt.don_vi[d]);
        }
        return s.join(" ");
    }

    bang_chu() {
        var stk = [];
        let r, v = this.value;
        while (v >= 1000) {
            r = v % 1000;
            v = Math.floor(v / 1000);
            stk.push(r);
        }

        let s = [];
        s.push(this.one_thousand(v, true));
        s.push(MyInt.hang[stk.length]);

        while (stk.length) {
            var one = stk.pop();
            if (one != 0) {
                s.push(this.one_thousand(one));
                s.push(MyInt.hang[stk.length])
            }
        }

        return s.join(" ");
    }

}

/******************* CONVERTER  ****************/
let converter = {
    date: function (v) { return new MyDate(v).toString(); },
    datetime: function (v) { return new MyDateTime(v).toString(); },
    int: function (v) { return new MyInt(v).toString() },
    format: function (f, v) {

        if (!f) { return v }

        let func = this[f];
        if (func) { return func(v) }

        return v;
    }
}

/******************* COMPONENT **************************/

class Component {
    static select(selector, callback) {
        let r = [];
        document.querySelectorAll(selector).forEach(n => r.push(callback(n)));

        return r;
    }
    constructor(selector, tagName = "div") {

        this._gen_chils = function (callback) {
            if (selector) {
                let self = this;
                this.content.children().remove().each(function () {
                    self.content.append(callback(this))
                });
            }
        }

        this.content = $(selector ?? document.createElement(tagName));
        this.appendTo = function (p) {
            this.content.appendTo(p);
            return this;
        }

        this.column = function (col = { lg: 12, xl: 12 }) {
            Grid.column(this.content, col);
            return this;
        }

        this.hide = function () { this.content.addClass("hide"); return this; }
        this.show = function (b = true) {
            if (b == false) return this.hide();

            this.content.removeClass("hide");
            return this;
        }
    }
}

/******************* GRID **************************/
class Grid {
    static column(selector, cols = { lg: 12, xl: 12 }) {
        let fn = $(selector).addClass("col-12");
        if (!cols["md"]) cols["md"] = 12;

        $.each(cols, (k, v) => fn.addClass('col-' + k + '-' + v));
        return fn;
    }
    static row(selector, cols = { lg: 12, xl: 12 }) {
        return Grid.column($(selector).addClass("row").children(), cols);
    }
}

/******************* DIALOGS **************************/
class Fade extends Component {
    constructor(cls) {
        super()

        let content = this.content;
        this.content.addClass("fade").addClass(cls)
        this.show = function (p = document.body) {
            content.appendTo(p);
            setTimeout(() => content.addClass("show"), 100);
            return this;
        }
        this.hide = function () {
            content.removeClass("show")
            setTimeout(() => content.remove(), 250);
        }
        this.close = function () {
            let fs = $(".fade").removeClass("show")
            setTimeout(() => fs.remove(), 250);
        }
    }
}
class BackDrop extends Fade {
    constructor() {
        super("modal-backdrop");
    }
}

class Dialog extends Fade {
    constructor(cancel = "OK") {
        super("modal");
        function div(c) { return $("<div class='" + c + "'/>") }
        function mod(c) { return div("modal-" + c) }

        let f = this.content;

        let d = mod('dialog')
        let t = mod('title h4').html('TITLE')
        let h = mod('header').append(t)
        let b = mod('body')
        let p = mod('footer')

        f.append(d.append(mod("content").append(h, b, p))).appendTo(document.body)

        let hide = this.close;
        let show = this.show;

        $("<button class='btn-close' />").appendTo(h).click(function () { hide() });
        let btnCancel = $("<button class='btn btn-sm btn-secondary'>" + cancel + "</button>").appendTo(p);
        btnCancel.click(hide);

        this.center = function () { d.addClass("modal-dialog-centered"); return this; }

        //this.title = function (s) { t.html(s); return this; }
        this.title = function (s) { typeof this; return this; }
        this.append = function (content) {
            b.append(content);
            return this;
        }

        f.click(function (e) {
            if (e.target.classList.contains("modal")) hide();
        })

        this.accept = function (ok, callback) {
            $("<button class='btn btn-sm btn-primary'>" + ok + "</button>").appendTo(p)
                .click(function () {
                    hide();
                    callback();
                });
            return this;
        }

        let bg = new BackDrop();
        this.show = function () {
            setTimeout(() => btnCancel.focus(), 200);
            bg.show();
            show();

            return this;
        }

        document.body.addEventListener("keydown", e => {
            switch (e.key) {
                case 'Escape': hide(); return;
            }
        })
    }
}

class FormControl extends Component {
    constructor(tagName) {
        super()
        this.label = $("<label class='form-label'/>");
        this.input = $(document.createElement(tagName))
            .addClass("form-control");
        this.content.addClass("form-group mb-3")

        this.id = "";

        this._change_trigger = function () {
            let fc = this;
            this.input.change(function () { fc.change(fc._get()) })
        }
        this.change = function () { }
        this.focus = function () { this.input.focus() }
        this.create_label = function () {
            let fc = this;
            fc.label.click(function () {
                fc.input.focus();
            })
            return fc.label;
        }
        this.create_input = function () {
            return this.input.prop("required", req);
        }

        let req = false;

        this.required = function (b = true) {
            if (req = b) {
                this.label.addClass("required");
            }
            else {
                this.label.removeClass("required");
            }
            return this;
        }
        this.nullable = function (b = true) {
            return this.required(!b);
        }

        this._get = function () { return this.input.val(); }
        this._set = function (v) { this.input.val(v) }

        this.val = function (v) {
            if (arguments.length == 0) {
                v = this._get();
                if (!this.content.hasClass("hide") && req && (v == '')) {
                    return null;
                }
                return v;
            }
            this._set(v);
            return this;
        }
    }
    name(n) {
        this.id = n;
        return this;
    }
    comment(t) {
        this.content.attr("placeholder", t);
        return this;
    }
    caption(t) {
        this.label.html(t ?? "");
        return this;
    }
    on_options_ready(o) { }
    options(o) {
        let data = {}
        if (typeof o === "string") o = o.split(';');
        if (Array.isArray(o)) {
            $.each(o, (i, s) => {
                let k = s.toString().trim();
                data[k] = k;
            })
        }
        else {
            $.each(o, (k, v) => {
                data[k] = v.toString().trim();
            })
        }

        this.on_options_ready(data);
        return this;
    }

    layout() {
        this.create_input();
        this._change_trigger();
        this.create_label();

        return this.content.append(this.label, this.input);
    }
}

class TextBox extends FormControl {

    static isNumber(k) {
        return k >= '0' && '9' >= k;
    }

    constructor(t = "text") {
        super("input")
        this.input.prop("type", t)
    }
}
class PasswodBox extends TextBox {
    constructor() {
        super("password")
        this.required();
    }
}
class NumberBox extends TextBox {
    constructor() {
        super("number");
    }
}

class CustomTextBox extends TextBox {
    constructor() {
        super();

        let cb = this;
        this.available = function (k, e) {
            return false;
        }
        this.input.keypress(function (e) {
            if (!cb.available(e.key, e)) {
                e.preventDefault();
            }
        })

        this.mask = function (m) {
            return this;
        }
    }
}
class PhoneBox extends CustomTextBox {
    constructor() {
        super();

        this.available = function (k) { return TextBox.isNumber(k) }
        this.mask = function (m) {
            return this;
        }
    }
}
class DateBox extends CustomTextBox {
    constructor() {
        super();

        this.comment("ngày tháng năm");

        let tb = this.input;
        let sep = ' ';
        this.available = function (k) {
            console.log(k)
            if (sep.indexOf(k) >= 0) {

                if (!tb.val()) return false;

                sep = k;
                return true;
            }
            return TextBox.isNumber(k)
        }

        this.input.blur(function () {
            let v = tb.val().trim().split(sep);
            if (!v[0]) return;

            let today = new MyDate();
            if (v.length < 2) v.push(today.month);
            if (v.length < 3) v.push(today.year);

            tb.val(new MyDate(v.join('/')));
        });
        this._get = function () {
            let v = new MyDate(tb.val());
            return v.year + '-' + v.month + '-' + v.day;
        }
        this._set = function (v) {
            let d = new MyDate(v);
            tb.val(d.date);
        }
    }
}
class TimeBox extends TextBox {
    constructor() {
        super();

        this.comment("giờ phút giây");

        let tb = this.input;
        let sep = ' ';
        this.available = function (k) {
            if (sep.indexOf(k) >= 0) {

                if (!tb.val()) return false;

                sep = k;
                return true;
            }
            return TextBox.isNumber(k)
        }

        this.content.blur(function () {
            let s = tb.val().trim();
            if (!s) return;

            let v = s.split(sep)
            if (v.length < 3) {
                let d = new MyDateTime("---" + v + "---");
                tb.val(d.hour + ":" + d.minute)
            }
            else {
                tb.val(new MyDateTime(s).fullTime)
            }
        });
    }
}

class ComboBox extends FormControl {
    constructor() {
        super("select");
        this.input.addClass("form-select");
        this.on_options_ready = function (o) {
            this.input.html("");
            $.each(o, (k, v) => {
                this.input.append($("<option/>").val(k).html(v))
            })
        }
    }
}

class CheckBox extends FormControl {

    static createGroup(opts, t = 'checkbox') {
        let items = [];
        $.each(opts, (k, v) => {
            let a = new CheckBox(t);
            a.input.attr("value", k);
            a.caption(v);

            items.push(a);
        })
        return items;
    }

    constructor(t = "checkbox") {
        super("input");
        this.create_input = function () {
            let fc = this;

            fc.input.prop("type", t).prop("class", "form-check-input");
            fc.label.click(function () {
                fc.input.click();
            })

            this._change_trigger();
            return $("<div class='form-check' />").append(this.input, this.create_label())
        }
        this.layout = function () {
            return this.content.append(this.create_input());
        }
        this._get = function () { return (this.input.prop("checked") ? 1 : 0); }
        this._set = function (v) { this.input.prop("checked", v); }
    }
}

class SingleChoiceBox extends FormControl {
    constructor() {
        super();

        let items = [];
        let g = $("<div />")

        this.on_options_ready = function (o) {

            g.html();
            items = CheckBox.createGroup(o, 'radio');

            $.each(items, (i, a) => {
                let self = this;
                g.append(a.create_input());
                a.change = function () {
                    self.input = a;
                    self._get = function () { return a.input.val() }
                    self.change(a.input.val())
                }
            })

            this.input = items[0];
        }
        this._get = function () { return null }
        this._set = function (v) {
            for (let a of items) {
                if (a.input.prop("value") == v) {
                    a._set(1);
                    this.input = a;
                    this._get = function () { return a.input.val() }

                    return;
                }
            }
        }
        this.layout = function () {
            $.each(items, (i, a) => a.input.attr("name", this.id))
            return this.content.append(this.create_label(), g);
        }
    }
}
class MultiChoiceBox extends FormControl {
    constructor() {
        super();

        let items = [];
        let g = $("<div />")

        this.on_options_ready = function (o) {

            g.html();
            items = CheckBox.createGroup(o);

            $.each(items, (i, a) => {
                let self = this;
                g.append(a.create_input());
                a.change = function () {
                    self.input = a;
                    self.change(self._get());
                };
            })

            this.input = items[0];
        }

        this._set = function (v) {
            let map = {};
            for (let k of (v ?? "").split(';')) map[k] = true;
            $.each(items, (i, a) => {
                a._set(map[a.input.prop("value")])
            })
        }
        this._get = function () {
            let s = "";
            $.each(items, (i, a) => {
                if (a._get()) {
                    if (s.length) s += ';';
                    s += a.content.prop("value");
                }
            })
            return s;
        }

        this.layout = function () {
            return this.content.append(this.create_label(), g);
        }
    }
}

class MultiLineBox extends FormControl {
    constructor() {
        super("textarea")

        this.lines = function (r = 5) {
            this.input.attr("rows", 5);
            return this;
        }
        this.lines();
    }
}

class RichTextBox extends FormControl {
    constructor() {
        super("pre");
        this.input.prop("contenteditable", true);

        this._get = function () { return this.input.html() }
        this._set = function (v) { this.input.html(v); }
    }
}

class ImportBox extends RichTextBox {
    constructor() {
        super();

        let header = [];
        let rows = [];
        let cols = {};

        this.fields = {};

        let fn = this;
        function to_table(text) {
            text = text.trim();
            rows = [];
            if (text.indexOf("<table") == 0) {
                $(text).find("tr").each(function () {
                    let line = [];
                    $(this).children().each(function () {
                        line.push(this.innerText.trim());
                    })

                    rows.push(line);
                })
            }
            else {
                let lines = [];
                if (text.indexOf("<div") == 0) {
                    $(text).each(function () {
                        lines.push(this.innerText);
                    })
                }
                else {
                    lines = text.split("\n");
                }
                for (const line of lines) {
                    let s = line.trim();
                    if (s) {
                        rows.push(s.split("\t"));
                    }
                }
            }

            header = rows.splice(0, 1)[0];
            $.each(header, (i, s) => header[i] = s.replace(/\n /g, "").toLowerCase())

            cols = {};

            let chk = {};
            $.each(fn.fields, (k, f) => {
                let i = header.indexOf(f.toLowerCase());
                if (chk[f] = (i >= 0)) {
                    cols[k] = i
                }
            })
            indicator.children().each(function () {
                this.className = chk[this.innerHTML] ? "" : "text-danger";
            })
        }
        function create_table(s) {

            to_table(s);

            let tab = $("<table class='paste-result'/>")
            let tr = $("<tr/>").appendTo($("<thead/>").appendTo(tab));
            $.each(header, (i, c) => {
                tr.append("<th >" + c + "</th>");
            })
            tr.append($("<th />"))

            let tb = $("<tbody/>").appendTo(tab);
            $.each(rows, (i, r) => {
                tr = $("<tr/>").appendTo(tb);
                for (let c of r) {
                    tr.append("<td>" + c + "</td>");
                }
                tr.append($("<td />"))
            })
            fn.input.html("").append(tab);
        }

        this.input.css("overflow-x", "auto").addClass("import-box");
        this.input[0].onpaste = function () {
            setTimeout(() => {
                create_table(fn.input.html());
            }, 500)
        }
        this.result = function (check_error) {

            let res = [];
            let err = indicator.find(".text-danger");
            if (err.length > 0) {
                if (!check_error) return null;

                err.each(function () { res.push(this.innerHTML) })
                if (!check_error(res)) return null;

                res = [];
            }

            for (let r of rows) {
                let o = {};
                $.each(cols, (k, i) => {
                    if (r[i]) o[k] = r[i];
                });
                res.push(o);
            }
            return res;
        }
        this.columns = function (fields = {}) {
            if (Array.isArray(fields)) {
                let f = {};
                $.each(fields, (i, a) => f[a] = a);

                fields = f;
            }
            this.fields = fields;
            return this;
        }

        let indicator = $("<div class='import-columns mb-1'/>");
        this.layout = function () {
            $.each(this.fields, (k, v) => {
                indicator.append($("<small/>").html(v))
            })
            return this.content.append(this.label, indicator, this.input)
        }
    }
}

class EditorBox extends Component {
    constructor(selector) {
        super(selector)
        let eds = []

        this.boxes = this.content;
        this.controls = function (items) {
            $.each(items, (k, a) => {
                eds.push(a);
                this.boxes.append(a.name(k).layout());
            })

            return this;
        }
        this.groups = function (items = [{ text: "", editors: {}}]) {
            if (!Array.isArray(items)) items = [items];
            $.each(items, (i, g) => {
                if (g.text) {
                    this.boxes.append($("<h3 class='mt-4'/>").html(g.text))
                }
                this.controls(g.editors)
            })
            return this
        }
        this._get = function () {
            let data = {}
            let e = [];
            for (let a of eds) {

                let v = a.val();
                if (v == null) {
                    e.push(a.id);
                }
                if (v) data[a.id] = v;
            }

            this.error = e.length ? e : null;
            return this.error ? null : data;
        }
        this._set = function (v) {
            $.each(eds, (i, a) => {
                a.val(v[a.id] ?? "");
            })
        }

        this.error = [];
        this.val = function (v) {
            if (arguments.length == 0) {
                return this._get();
            }
            this._set(v);
            return this;
        }
    }
}
class SingleForm extends EditorBox {
    constructor(selector) {
        super(selector)

        let last = this.content;
        (function divs() {
            for (let c of arguments) {
                let p = $("<div />").addClass(c);
                last.append(p);
                last = p;
            }
        })("d-flex flex-column container",
            "align-items-center justify-content-center g-0 row min-vh-100",
            "py-8 py-xl-0 col-xl-6 col-lg-8 col-md-8 col-12",
            "smooth-shadow-md card",
            "p-6 card-body",
            "mb-4"
        )
        let h = $("<h2 class='mb-2 form-caption'/>")
        let c = $("<p class='mb-6'><span class='text-primary'/></p>")
        this.boxes = $("<form method='post' class='row' />");

        let ok = $("<button hidden />").appendTo(this.boxes);
        let self = this;
        function submit() {
            ok.click();
        }
        function try_submit(fn) {
            let v = self.val();
            if (!v) {
                ok.click();
            } else {
                fn(v);
            }
        }
        this.post = function (url, data) {
            $("<form method='post' hidden/>")
                .appendTo(document.body)
                .prop("action", url).append($("<input name='json' />").val(JSON.stringify(data)))
                .submit();
        }

        let s = $("<button />")
            .html("SUBMIT")
            .addClass("btn btn-primary")
            .click(function () { submit() })

        let a = $("<div class='d-grid mt-6'/>")
            .append(s)

        last.append(h, c, this.boxes, a);

        this.parent = function (selector) {
            $(selector).append(this.content);
            return this;
        }
        this.action = function (url) {
            submit = function () {
                try_submit(v => self.post(url, v));
            }
            return this;
        }
        this.title = function (s) { h.html(s); return this; }
        this.comment = function (s, t) { c.html("<span class='text-" + (t ?? "primary") + "'>" + s + "</span>"); return this; }
        this.accept = function (submit_text, value_callback) {
            s.html(submit_text ?? "SUBMIT")
            submit = function () {
                try_submit(v => value_callback(v));
            }
            return this;
        }

        this.boxes.keypress(function (e) {
            if (e.key == "Enter") submit();
        })
    }
}

class EditorDialog extends Dialog {
    constructor(editors) {
        super("Cancel");

        let frm = $("<div />");
        let edi = new EditorBox(frm).controls(editors);
        this.append(frm);

        this.accept("OK", () => {
            let v = edi.val();
            console.log(v)
        })

        this.body = edi;
    }

}
let dialog = {
    message: function (t, h) {
        return new Dialog("Đã hiểu").title(h ?? "system").append($("<div/>").html(t)).center().show();
    },
    ask: function (t, h, acceptCallback) {
        return new Dialog("Không").title(h ?? "system").append($("<div/>").html(t)).accept("Có", () => {
            acceptCallback();
            return true;
        }).center().show();
    }
}

/******************* TOAST **************************/
class Toast extends Fade {
    constructor() {
        super("toast mb-2");

        let show = this.show;
        let hide = this.hide;

        let h = $("<div class='toast-header'/>")
        let b = $("<div class='toast-body'/>").html("toast body")

        let ico = $("<span />")
        let s = new Pen().start(12, 12);

        let tit = $("<strong class='me-auto' />").html("system");
        let sub = $("<small />")
        let clo = $("<button class='btn-close' />").click(hide);

        this.content.append(h, b);
        h.append(ico, tit, sub, clo);
        s.paper.width(24).height(24).appendTo(ico);

        let idi = s.circle(10);

        this.title = function (t) { tit.html(t ?? "system"); return this; }
        this.text = function (t) { b.html(t ?? ""); return this; }
        this.comment = function (t) { sub.html(t ?? ""); return this; }
        this.mode = function (m) {
            idi.attr("fill", "var(--bs-" + m + ')');
            return this;
        }

        this.show = function (seconds) {
            let con = document.getElementById("toast-container");
            if (!con) {
                con = document.createElement("div");
                con.id = "toast-container";
                document.body.appendChild(con);
            }
            this.content.appendTo(con);
            show(con);

            if (seconds) setTimeout(hide, seconds * 1000);
        }
    }
}

/******************* CARD **************************/
class Card extends Component {
    static init(selector) {
        return Component.select(selector ?? ".card", n => new Card(n))
    }
    constructor(selector) {
        super(selector);

        let s = this.content.children();
        let h = s[0];
        let b = h.nextElementSibling;
        if (!b) { b = h; h = null }

        if (h) {
            if (h.innerHTML) {
                h.classList.add("card-header");
            }
            let f = b.nextElementSibling;
            if (f && f.innerHTML) f.classList.add("card-footer");
        }
        b.classList.add("card-body");
        this.content.addClass("card");
    }
}

/******************* ACCORDION **************************/
class Accordion extends Component {
    static init(selector = '.accordion') {
        return Component.select(selector, n => new Accordion(n))
    }
    constructor(selector) {
        super(selector)

        let self = this;
        this.append = function (selector) {
            let b = $(selector);
            let h = b.children().first().remove();

            this.create(h, b);
            return this;
        }
        this.create = function (head, body) {
            const ce = "collapse";
            const cd = "collapsed";

            function tag(n, c) { return $(document.createElement(n)).addClass("accordion-" + (c ?? n)) }
            function div(c) { return tag("div", c) }

            let btn = tag("button").addClass(cd);
            let tit = tag("span", "item-title").append(head);

            let hdr = tag("h2", "header").append(btn.append(tit));
            let con = div(ce).addClass(ce).append(div("body").append(body));

            let ite = div("item").append(hdr, con);

            $.extend(btn[0], {
                body: con,
                togg: function () {
                    this.body.toggleClass("show");
                    this.classList.toggle(cd);
                }
            })
            btn.click(function () {
                if (this.classList.contains(cd)) {
                    self.content.find(".accordion-button:not(.collapsed)")
                        .each(function () { this.togg() })
                }
                this.togg();
            })

            return ite.appendTo(this.content);
        }

        this.content.addClass("accordion")
        this._gen_chils((n, s) => {
            self.append(n);
            return null;
        })
    }
}

/******************* TABLE **************************/
class Table extends Component {
    static init(selector = 'table') {
        for (let k in Table.style) {
            if (k != 'set') {
                Table.style[k] = function (s) {
                    this.set(k, s);
                    return this;
                }
            }
        }
        Component.select(selector, n => new Table(n))
        return Table.style;
    }

    static style = {
        set: function (cls, selector) {
            $(selector ?? 'table').addClass('table-' + cls);
            return this;
        },
        dark: function (sel) { return this },
        light: function (sel) { return this },
        bordered: function (sel) { return this },
        borderless: function (sel) { return this },
        striped: function (sel) { return this },
        hover: function (sel) { return this },
    }

    constructor(selector) {
        super(selector, "table");

        let cols = {
            fields: {},
            add: function (cls, src) {
                let k = cls.split(' ')[0];
                if (!src) src = $("<th/>").appendTo(thead);

                if (k && !this.fields[k]) {
                    this.fields[k] = src;
                }
                return this;
            },
            create: function () {
                for (let s of arguments) {
                    this.add(s);
                }
                return this;
            }
        }
        let thead = selector ? this.content.find("tr").first() : $("<tr/>").appendTo($("<thead/>").appendTo(this.content));
        let tbody = thead.next();
        if (tbody.length == 0) {
            tbody = $("<tbody/>").appendTo(this.content);
        }

        this.content.addClass("text-nowrap table");
        thead.children().each(function () {
            cols.add(this.className, $(this))
        })

        this.colums = function () { return cols; }
    }
}

/******************* NAVS **************************/
class NavMenu extends Component {
    static init(selector = '#horiz-menu') {
        return new NavMenu(selector)
    }
    constructor(selector) {
        super(selector)
        this.content.addClass("nav");

        this._gen_chils(n => {
            return $("<div/>").addClass('nav-item').append($(n).addClass('nav-link').attr("role", "button"))
        })

        this.each = function (callback) {
            this.content.find(".nav-link").each(function () {
                callback(this);
            })
        }
        this.pills = function (callback) {
            this.content.addClass("nav-pills");

            let self = this;
            this.each(a => {
                $(a).click(function () {
                    if (this.classList.contains("active")) return;

                    self.each(o => o.classList.remove("active"));
                    this.classList.add("active");

                    if (callback) callback(this);
                })
            })
        }
    }
}

/******************* SIDE MENU **************************/
class SideMenu extends Component {
    static init(selector = '#left-menu') {
        return new SideMenu(selector)
    }
    constructor(selector) {
        super(selector)
        this._gen_chils(n => {
            return $(n).addClass("navbar flex-column").children().each(function () {
                let li = $(this).addClass("nav-item");
                let a = li.children().first();
                if (a.prop("tagName") == "DIV") {
                    a.addClass("nav-heading");
                    return li;
                }
                let t = a.html();
                let c = a.prop("class");
                if (c) {
                    t = "<i class='fa fa-" + c + "'></i>" + t;
                }
                t = "<span>" + t + "</span>";
                let u = a.next();

                if (u.length) {
                    t += "<i class='fa fa-chevron-down'></i>";

                    new SideMenu(u);
                    a.click(function () {
                        $(this.parentNode).toggleClass("show");
                    })

                    li.addClass("collapsed")
                }
                a.html(t).prop("class", "nav-link");
                if (!a.prop("href")) a.prop("href", "#");
            })
        })
    }
}

/***************************************/
function $alphabet(selector = ".item") {
    let banner = $("<ul class='alphabet-table'/>").append("<li><i class='fa fa-star'></i></li>").appendTo(document.body);
    let alp = {
    };
    $(selector).each(function () {
        let a = this.getAttribute("data-alphabet").toUpperCase();
        let list = alp[a];
        if (!list) {
            alp[a] = list = [];
        }
        list.push(this);
    })
    $.each(alp, (k, v) => {
        banner.append("<li>" + k + "</li>");
    });
    banner.children().click(function () {
        let b = this.innerText == "";
        $(selector).attr("hidden", !b);

        if (!b) {
            for (let a of alp[this.innerText]) {
                a.hidden = false;
            }
        }
    })

    return banner;
}

/***************************************/
function copyText(text) {
    let div = $("<pre contenteditable='true'/>")
        .appendTo(document.body)
        .text(text)
        .focus()
        .get(0);

    let sel = document.getSelection();
    let range = document.createRange();

    let t = div.firstChild;

    range.setStart(t, 0)
    range.setEnd(t, text.length);

    sel.removeAllRanges();
    sel.addRange(range);

    document.execCommand("copy");
    div.remove();

    toast.warning("Đã copy dữ liệu vào clipboard");
}
function copyTable(arr, cols, headers) {

    if (!headers) {
        headers = cols;
    }

    let lines = [headers.join('\t')]
    for (let o of arr) {
        let line = [];
        for (let n of cols) {
            line.push(o[n] ?? "");
        }
        lines.push(line.join('\t'));
    }
    copyText(lines.join("\r\n"));
}
function csvDownload(arr, cols, headers) {

    if (!headers) {

        let c = [];
        headers = [];

        $.each(cols, (k, v) => {
            c.push(k);
            headers.push(v);
        })
        cols = c;
    }

    let lines = [headers]
    for (let o of arr) {
        let line = [];
        for (let n of cols) {
            line.push(o[n] ?? "");
        }
        lines.push(line);
    }

    var s = "";
    for (const line of lines) {
        for (const cel of line) {
            let v = cel;

            if (typeof cel === "string" && cel.indexOf(',') >= 0) {
                v = '"' + v + '"'
            }
            s += v + ',';
        }
        s += "\r\n";
    }

    var BOM = "\uFEFF";
    window.open("data:text/csv;charset=utf-8," + BOM + encodeURI(s));
}

function redirect(url, target) {
    let a = document.createElement("a");
    a.href = url ?? window.location.href;

    if (target) a.setAttribute("target", target);
    document.body.appendChild(a);

    a.click();
}
