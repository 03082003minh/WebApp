class Point {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;

        this.offset = function (dx = 0, dy = 0) {
            return new Point(this.x + dx, this.y + dy);
        }
        this.move = function (dx = 0, dy = 0) {
            this.x += dx; this.y += dy;
            return this;
        }
    }
}
class Pen {
    constructor(paperSelector, width, color, fill) {

        function applyAttr(s) {
            if (width) s.attr("stroke-width", width);
            if (color) s.attr("stroke", color);
            if (fill) s.attr("fill", fill);

            width = null;
            color = null;
            fill = null;
            return s;
        }

        let first = new Point(0, 0);
        let last = first;
        let points = [first];

        let paper = $(paperSelector ?? node('svg'));
        let ss = [applyAttr(paper)];

        function node(name) {
            return document.createElementNS("http://www.w3.org/2000/svg", name);
        }
        function shape(name) {
            let s = $(node(name)).appendTo(paper);

            ss.push(s);
            applyAttr(s);

            return s;
        }

        this.width = function (w) {
            width = w;
            return this;
        }
        this.color = function (c) {
            color = c;
            return this;
        }
        this.fill = function (c) {
            fill = c;
            return this;
        }
        this.start = function (x = 0, y = 0) {
            points = [first = last = new Point(x, y)]
            return this;
        }
        this.move = function (dx = 0, dy = 0) {
            points.push(last = last.offset(dx, dy));
            return this;
        }
        this.offset = function (dx = 0, dy = 0) {
            points.forEach(p => p.move(dx, dy));
            return this;
        }
        
        this.rect = function (w, h, p) {
            if (!p) p = last;
            return shape("rect")
                .attr("x", p.x)
                .attr("y", p.y)
                .width(w)
                .height(h)
        }

        this.line = function (f, l) {
            if (!f) f = first;
            if (!l) l = last;
            return shape("line")
                .attr("x1", f.x)
                .attr("y1", f.y)
                .attr("x2", l.x)
                .attr("y2", l.y)
        }
        this.circle = function (r = 1, c) {
            if (!c) c = last;
            return shape("circle")
                .attr("cx", c.x)
                .attr("cy", c.y)
                .attr("r", r)
        }
        this.text = function (s, p) {
            if (!p) p = last;
            return shape("text")
                .attr("x", p.x)
                .attr("y", p.y)
                .html(s)
        }

        function pts(name) {
            let s = [];
            points.forEach(p => s.push(p.x + ',' + p.y));
            return shape(name)
                .attr("points", s.join(' '))
                .attr("fill", fill ?? "none")
        }
        this.polyline = function () {
            return pts("polyline")
        }
        this.polygon = function () {
            return pts("polygon")
        }
        this.paper = paper;
    }
}

let icon = {
    width: 24,
    height: 24,
    bars: function(i) {
        let p = new Pen(i, 2);
        p.start(4, -2).move(16, 0);

        for (let k = 0; k < 3; k++) {
            p.offset(0, 7);
            p.line();
        }
    },
    dots: function (i) {
        let p = new Pen(i, 2);
        p.start(12, -2);

        for (let k = 0; k < 3; k++) {
            p.offset(0, 7);
            p.circle(1);
        }
    },
    "right-arrow": function (i) {
        let p = new Pen(i, 2);
        let d = 8;
        p.start(0, 0).move(d, d).move(-d, d).offset(d, d / 2).polyline();
    },
    email: function (i) {
        let p = new Pen(i, 2);
        let w = 24, h = 12;
        p.start(0, 0)
            .move(w, 0)
            .move(0, h)
            .move(-w, 0)
            .move(0, -h)

        w >>= 1; h >>= 1;
        p.move(w, h).move(w, -h).polyline();
    },
}
