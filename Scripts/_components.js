window.init_toggle = (function (cls) {
    $("." + cls).each(function () {
        let target = $(this.getAttribute("data-target"));

        target.addClass(this.getAttribute("data-toggle"));
        this.addEventListener("click", () => {
            target.toggleClass("toggled");
        })
    })
})("nav-toggle");

window.init_svg = (function (cls) {
    $("svg." + cls).each(function () {
        this.classList.forEach(n => {
            let fn = icon[n];
            if (fn) {
                fn(this);
                return;
            }
        })
    })
})("icon");

window.dropdown_menu = (function (cls) {
    let itemCls = cls + "-item";
    let opened = null;
    $('.' + cls).each(function () {
        let m = $(this.lastElementChild).addClass(cls + "-menu");
        m.children().each(function () {
            if (this.tagName == "A") {
                $(this).addClass(itemCls).attr("role", "button");
            }
        });
    })
    $(document.body).click(function (e) {
        let t = e.target;
        function c() {
            if (!t) return null;
            let tc = t.classList;
            if (tc.contains(itemCls)) return null;
            if (tc.contains(cls)) return tc.contains("show") ? null : t;
            return c(t = t.parentElement);
        }
        function x() {
            if (opened) {
                opened.classList.remove("show");
                opened = null;
            }
        }

        if (!c()) { x(); return; }
        x();
        (opened = t).classList.add("show");
    })
})("dropdown");

SideMenu.init(); Card.init(); Accordion.init()

window.init_search = (function () {
    let f = $("#form-search");
    if (!search.show) {
        f.remove();
        return;
    }
    let i = f.children().first()
    if (search.text) i.change(function(){search.text(this.value)});
    if (search.key) i.keyup(function (){setTimeout(()=>search.key(this.value),100)});
})();