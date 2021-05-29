window.onload = function (event) {

    // Get filename
    // -------------------------------------------------------------------------
    function getFilename(variable)
    {
       let search = window.location.search.substring(1);
       let vars = search.split("&");
       for (let i=0; i<vars.length; i++) {
                let parm = vars[i].split("=");
                if (parm[0] === variable) {
                    return parm[1];
                }
       }
       return(false);
    }

    // Get data
    // -------------------------------------------------------------------------
    const script = getFilename("id");
    if (script) {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                let data = JSON.parse(this.responseText);
                start(data);
            // } else {
            //     console.log('URL is not valid.');
            }
        };
        xmlhttp.open("GET", "json/" + script + ".json", true);
        xmlhttp.send();
    }

    // Add file details
    // -------------------------------------------------------------------------
    function fill_info(metadata) {
        let info = document.getElementById("info");
        let help = document.getElementById("help");

        let user = document.getElementById("user");
        let count = document.getElementById("count");
        let desc = document.getElementById("desc");
        user.innerText = metadata.user;
        count.innerText = metadata.nodes;
        let span = document.createElement("span");
        span.innerText = metadata.desc; // + metadata.link;
        desc.appendChild(span);
        info.style.visibility = "visible";

        help.onclick = function (e) {
            e.preventDefault();
            console.log("Display Help");
        };
    }

    // Draw line on the svg
    // -------------------------------------------------------------------------
    function svg_add_line(group, ns, line) {
        let e = document.createElementNS(ns, "line");
        e.setAttribute("x1", line[0]);
        e.setAttribute("y1", line[1]);
        e.setAttribute("x2", line[2]);
        e.setAttribute("y2", line[3]);
        group.appendChild(e);
    }

    // Loop through lines
    // -------------------------------------------------------------------------
    function svg_add_lines(svg, ns, items, name) {
        let lines = items.lines;
        let color = items.color;
        let group = document.createElementNS(ns, "g");
        group.setAttribute("name", name);
        group.setAttribute("stroke", "rgb("+ color[0] + ","
                                           + color[1] + ","
                                           + color[2] + ")");
        for (let i=0; i<lines.length; i++) {
            svg_add_line(group, ns, lines[i]);
        }
        svg.appendChild(group);
    }

    // Draw item on the svg
    // -------------------------------------------------------------------------
    function svg_add_item(group, ns, color, size, pos, kind) {
        if (kind == "rect") {
            let e = document.createElementNS(ns, kind);
            e.setAttribute("x", pos[0]);
            e.setAttribute("y", pos[1]);
            e.setAttribute("width", size[0]);
            e.setAttribute("height", size[1]);
            e.setAttribute("fill", "rgb("+ color[0] + ","
                                         + color[1] + ","
                                         + color[2] + ")");
            group.appendChild(e);
        } else if (kind == "double") {
            let e = document.createElementNS(ns, "rect");
            e.setAttribute("x", pos[0]);
            e.setAttribute("y", pos[1]);
            e.setAttribute("width", size[0]);
            e.setAttribute("height", size[1]);
            e.setAttribute("fill", "rgb("+ color[0] + ","
                                         + color[1] + ","
                                         + color[2] + ")");
            group.appendChild(e);

            e = document.createElementNS(ns, "rect");
            e.setAttribute("x", pos[0]+size[0]*0.1);
            e.setAttribute("y", pos[1]+size[1]*0.1);
            e.setAttribute("width", size[0]-size[0]*0.2);
            e.setAttribute("height", size[1]-size[1]*0.4);
            e.setAttribute("fill", "rgb("+ color[0]/2 + ","
                                         + color[1]/2 + ","
                                         + color[2]/2 + ")");

            group.appendChild(e);

        } else if (kind == "circle") {
            let e = document.createElementNS(ns, kind);
            let cx = size[0]/2 + pos[0];
            let cy = size[1]/2 + pos[1];
            e.setAttribute("cx", cx);
            e.setAttribute("cy", cy);
            e.setAttribute("r", size[0]/2);
            e.setAttribute("fill", "rgb("+ color[0] + ","
                                         + color[1] + ","
                                         + color[2] + ")");
            group.appendChild(e);
        }
    }

    // Loop through backdrops
    // -------------------------------------------------------------------------
    function svg_add_backdrops(svg, ns, items, name, kind) {
        let group = document.createElementNS(ns, "g");
        group.setAttribute("name", name);
        for (let i=0; i<items.length; i++) {
            let color = items[i].color;
            let pos = items[i].pos;
            let size = items[i].size;
            svg_add_item(group, ns, color, size, pos, kind);
        }
        svg.appendChild(group);
    }

    // Loop through items
    // -------------------------------------------------------------------------
    function svg_add_items(group, ns, items, kind) {
        for (let i=0; i<items.length; i++) {
            let color = items[i].color;
            let nodes = items[i].nodes;
            for (let j=0; j<nodes.length; j++) {
                let size = nodes[j].size;
                let elements = nodes[j].pos;
                for (let k=0; k<elements.length; k++) {
                    let pos = elements[k];
                    svg_add_item(group, ns, color, size, pos, kind);
                }
            }
        }
    }

    // Set quality
    // -------------------------------------------------------------------------
    function set_quality(item, quality) {
        // "crispEdges", "geometricPrecision", "optimizeSpeed"
        // item.setAttribute("shape-rendering", quality);

        item.setAttribute("shape-rendering", "crispEdges");
        // item.setAttribute("shape-rendering", "optimizeSpeed");
    }

    // Create the svg
    // -------------------------------------------------------------------------
    function create_svg(data, width, height) {
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        // set_quality(svg, "optimizeSpeed");
        // set_quality(svg, "crispEdges");

        let ns = svg.namespaceURI;

        // Backdrops
        let nodes = data.backdrops;
        svg_add_backdrops(svg, ns, nodes, "backdrops", "rect");

        // Lines
        let group = document.createElementNS(ns, "g");
        group.setAttribute("name", "connections");
        svg.appendChild(group);
        set_quality(group, "geometricPrecision");

        let lines = data.connections;
        svg_add_lines(group, ns, lines, "plain");
        lines = data.viewers;
        svg_add_lines(group, ns, lines, "viewers");
        lines = data.other;
        svg_add_lines(group, ns, lines, "other");

        // Interactive
        group = document.createElementNS(ns, "g");
        group.setAttribute("name", "links");
        svg.appendChild(group);
        set_quality(group, "geometricPrecision");
        let links = group;

        lines = data.expressions;
        svg_add_lines(group, ns, lines, "expressions");
        lines = data.clones;
        svg_add_lines(group, ns, lines, "clones");
        lines = data.hidden;
        svg_add_lines(group, ns, lines, "hidden");

        // Nodes
        group = document.createElementNS(ns, "g");
        group.setAttribute("name", "nodes");
        svg.appendChild(group);
        nodes = data.nodes;
        svg_add_items(group, ns, nodes, "rect");
        nodes = data.reads;
        svg_add_items(group, ns, nodes, "double");
        nodes = data.circles;
        svg_add_items(group, ns, nodes, "circle");

        return [svg, links];
    }

    // Resize and position the canvas
    // -------------------------------------------------------------------------
    function init(width, height, margin) {
        // let scale = Math.min(canvas.offsetWidth/width,
        //                      canvas.offsetHeight/height);
        // scale = scale*margin;
        // let x = canvas.offsetWidth/2 - canvas.offsetWidth*scale;
        // let y = (canvas.offsetHeight - height*scale)/2;
        // let m = Math.sqrt(window.innerWidth*window.innerWidth +
        //                   window.innerHeight*window.innerHeight);

        let scale = Math.min(window.innerWidth/width,
                             window.innerHeight/height);
        scale = scale*margin;
        let x = window.innerWidth/2 - width/2*scale;
        let y = (window.innerHeight - height*scale)/2;
        let m = Math.hypot(window.innerWidth, window.innerHeight);

        let cx = window.innerWidth/2;
        let cy = window.innerHeight/2;

        return [x, y, scale, m, cx, cy];
    }


    // =========================================================================
    // Start the show
    // =========================================================================
    function start(data) {

        // Set the stroke width
        // ---------------------------------------------------------------------
        function set_stroke() {
            svg.setAttribute("stroke-width", 2+1/scale);
        }

        // Animate
        // ---------------------------------------------------------------------
        function animate(animation) {
            if (animation) {
                now = new Date().getTime();
                // canvas.classList.add("animated");
                canvas.style.transition = "transform 0.2s linear";
            } else {
                // canvas.classList.remove("animated");
                canvas.style.transition = "";
            }
        }

        // End of transition listener (adjust stroke size)
        // ---------------------------------------------------------------------
        function add_listeners() {
            canvas.addEventListener("transitionend", function() {
                set_quality(svg, "geometricPrecision");
                set_stroke();
                animate(false);
                console.log("finish", new Date().getTime() - now);
            });
        }

        // Move canvas
        // ---------------------------------------------------------------------
        function move() {
            canvas.style.transform = "translate(" + x + "px, "
                                                  + y + "px) scale("
                                                  + scale + ")";
        }

        // Handle Mouse interaction
        // ---------------------------------------------------------------------
        window.onmouseup = function (e) {
            e.preventDefault();
            set_stroke();
            set_quality(svg, "geometricPrecision");
            panning = false;
            zooming = false;
        };

        window.onmousedown = function (e) {
            e.preventDefault();
            animate(false);
            start = {x: e.clientX, y: e.clientY};
            if (e.buttons == 1) {
                prev = {x: start.x - x, y: start.y - y};
                panning = true;
                zooming = false;
            } else if (e.buttons == 4 || e.buttons == 5) {
                drag = start;
                panning = false;
                zooming = true;
            }
        };

        window.onmousemove = function (e) {
            e.preventDefault();
            if (panning) {
                if (Math.abs(start.x-e.clientX) > 20 &&
                    Math.abs(start.y-e.clientY) > 20) {
                    set_quality(svg, "optimizeSpeed");
                }
                x = e.clientX - prev.x;
                y = e.clientY - prev.y;
                move();
            } else if (zooming) {
                let zx = (start.x - x) / scale;
                let zy = (start.y - y) / scale;
                let diff = {x: drag.x-e.clientX, y: drag.y-e.clientY};
                let magn = Math.hypot(diff.x, diff.y)/m;
                let delta = Math.sign(-diff.x);
                if (delta < 0 && scale == min_scale) {
                    return;
                }
                if (delta > 0 && scale == max_scale) {
                    return;
                }
                let s = magn * delta;
                scale += s;
                scale = Math.min(Math.max(min_scale, scale), max_scale);
                x = start.x - zx * scale;
                y = start.y - zy * scale;
                set_quality(svg, "optimizeSpeed");
                move();
                drag = {x: e.clientX, y: e.clientY};
                if (s+scale >= scale*1.2 || magn < 0.0001 ||
                    scale == min_scale || scale == max_scale) {
                    set_stroke();
                }
            }
        };

        window.onwheel = function (e) {
            let zx = (e.clientX - x) / scale;
            let zy = (e.clientY - y) / scale;
            delta = Math.sign(-e.deltaY);
            if (delta < 0 && scale == min_scale) {
                return;
            }
            if (delta > 0 && scale == max_scale) {
                return;
            }
            scale *= 1 + delta * wheel_speed;
            // scale += delta * -wheel_speed;
            scale = Math.min(Math.max(min_scale, scale), max_scale);
            x = e.clientX - zx * scale;
            y = e.clientY - zy * scale;
            animate(true);
            set_quality(svg, "optimizeSpeed");
            move();
        };

        // Handle keyboard
        // ---------------------------------------------------------------------
        function zoom(amount) {
            if (amount < 1 && scale == min_scale) {
                return;
            }
            if (amount > 1 && scale == max_scale) {
                return;
            }
            animate(true);
            set_quality(svg, "optimizeSpeed");
            let zx = (cx - x) / scale;
            let zy = (cy - y) / scale;
            scale *= amount;
            scale = Math.min(Math.max(min_scale, scale), max_scale);
            x = cx - zx * scale;
            y = cy - zy * scale;
            move();
        };

        document.addEventListener("keydown", function(e) {
            if (e.key === "e") {
                if (links.classList.contains("visible")) {
                    links.classList.remove("visible");
                } else {
                    links.classList.add("visible");
                }
            } else if (e.key === "f") {
                if (x != reset.x || y != reset.y || scale != reset.scale) {
                    x = reset.x;
                    y = reset.y;
                    scale = reset.scale;
                    animate(true);
                    move();
                } 
            } else if (e.key === "+") {
                zoom(1.5);
            } else if (e.key === "-") {
                zoom(0.5);
            } else if (e.key === "a") {
                canvas.style.animationPlayState = "paused !important";
            }
        });

        // Re-adjust in case of window maximized/etc - Needs improvement
        // ---------------------------------------------------------------------
        function resized() {
            [x, y, min_scale, m, cx, cy] = init(width, height, margin);
            scale = min_scale;
            reset = {x: x, y: y, scale: scale};
            min_scale *= margin;
            set_stroke();
            move();
        }

        // Make the svg visible
        // ---------------------------------------------------------------------
        function display() {
            links.classList.add("links");
            canvas.appendChild(svg);
            canvas.style.visibility = "visible";
        }

        // =====================================================================
        const width = data.width;
        const height = data.height;

        const [svg, links] = create_svg(data, width, height);

        const canvas = document.getElementById("canvas");

        const margin = 0.9;
        const max_scale = 0.5;
        var [x, y, min_scale, m, cx, cy] = init(width, height, margin);
        var scale = min_scale;
        var reset = {x: x, y: y, scale: scale};

        min_scale *= margin;

        var start = {x: x, y: y};
        var prev  = {x: x, y: y};
        var drag  = {x: x, y: y};

        var panning = false;
        var zooming = false;
        // var wheel_speed = min_scale/(max_scale-min_scale);
        var wheel_speed = (max_scale-min_scale)/5;

        window.onresize = resized;
        var now = 0;

        fill_info(data.metadata);
        add_listeners(canvas);
        set_stroke();
        move();
        display();
    }
};
