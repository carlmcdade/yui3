var VMLGraphics = function(config) {
    this.initializer.apply(this, arguments);
};

VMLGraphics.prototype = {
    initializer: function(config) {
        config = config || {};
        var w = config.width || 0,
            h = config.height || 0;
        this._vml = this._createGraphics();
        this.setSize(w, h);
        this._initProps();
    },

    _initProps: function() {
        this._fillColor = null;
        this._strokeColor = null;
        this._strokeWeight = 0;
        this._fillProps = null;
        this._path = '';
        this._width = 0;
        this._height = 0;
        this._x = 0;
        this._y = 0;
        this._fill = null;
        this._stroke = 0;
        this._stroked = false;
    },

    _clearPath: function()
    {
        this._shape = null;
        this._path = '';
        this._width = 0;
        this._height = 0;
        this._x = 0;
        this._y = 0;
    },

    _createGraphics: function() {
        var group = this._createGraphicNode("group");
        group.style.display = "inline-block";
        group.style.position = 'absolute';
        return group;
    },

    beginBitmapFill: function() {
        Y.log('bitmapFill not implemented', 'warn', 'graphics-vml');
        return this;
    },

    beginFill: function(color, alpha) {
        if (color) {
            if (alpha) {
                this._fillProps = {
                    type:"solid",
                    opacity: alpha
                };
            }
            this._fillColor = color;
            this._fill = 1;
        }

        return this;
    },

    beginGradientFill: function(config) {
        var type = config.type,
            colors = config.colors,
            alphas = config.alphas || [],
            ratios = config.ratios || [],
            fill = {
                colors:colors,
                ratios:ratios
            },
            len = alphas.length,
            i = 0,
            alpha,
            oi,
            rotation = config.rotation || 0;
    
        for(;i < len; ++i)
        {
            alpha = alphas[i];
            oi = i > 0 ? i + 1 : "";
            alphas[i] = Math.round(alpha * 100) + "%";
            fill["opacity" + oi] = alphas[i];
        }
        if(type === "linear")
        {
            if(config)
            {
            }
            if(rotation > 0 && rotation <= 90)
            {
                rotation = 450 - rotation;
            }
            else if(rotation <= 270)
            {
                rotation = 270 - rotation;
            }
            else if(rotation <= 360)
            {
                rotation = 630 - rotation;
            }
            else
            {
                rotation = 270;
            }
            fill.type = "gradientunscaled";
            fill.angle = rotation;
        }
        else if(type === "radial")
        {
            fill.alignshape = false;
            fill.type = "gradientradial";
            fill.focus = "100%";
            fill.focusposition = "50%,50%";
        }
        fill.ratios = ratios || [];
        
        if(!isNaN(config.tx) ||
            !isNaN(config.ty) ||
            !isNaN(config.width) ||
            !isNaN(config.height))
        {
            this._gradientBox = {
                tx:config.tx,
                ty:config.ty,
                width:config.width,
                height:config.height
            };
        }
        else
        {
            this._gradientBox = null;
        }
        this._fillProps = fill;
        return this;
    },

    clear: function() {
        this._path = '';
        return this;
    },

    curveTo: function(controlX, controlY, anchorX, anchorY) {
        return this;
    },


	drawCircle: function(x, y, r, start, end, anticlockwise) {
        this._width = this._height = r * 2;
        this._x = x - r;
        this._y = y - r;
        this._shape = "oval";
        this._drawVML();
	},

    drawEllipse: function(x, y, w, h) {
        this._width = w;
        this._height = h;
        this._x = x;
        this._y = y;
        this._shape = "oval";
        this._drawVML();
    },

    drawRect: function(x, y, w, h) {
        this._x = x;
        this._y = y;
        this._width = w;
        this._height = h;
        this.moveTo(x, y);
        this.lineTo(x + w, y);
        this.lineTo(x + w, y + h);
        this.lineTo(x, y + h);
        this.lineTo(x, y);
        this._drawVML();
    },

    getShape: function(config)
    {


    },

    _trackSize: function(w, h) {
        if (w > this._width) {
            this._width = w;
        }
        if (h > this._height) {
            this._height = h;
        }
    },

    _shape: null,

	drawRoundRect: function(x, y, r, start, end, anticlockwise) {
        return this;
	},

    _drawVML: function()
    {
        var shape = this._createGraphicNode(this._shape),
            w = this._width,
            h = this._height,
            fillProps = this._fillProps;
        
        if(this._path)
        {
            if(this._fill)
            {
                this._path += ' x';
            }
            if(this._stroke)
            {
                this._path += ' e';
            }
            shape.path = this._path;
            shape.coordSize = w + ', ' + h;
        }
        else
        {
            shape.style.display = "block";
            shape.style.position = "absolute";
            shape.style.left = this._x + "px";
            shape.style.top = this._y + "px";
        }
        
        if (this._fill) {
            shape.fillColor = this._fillColor;
        }
        else
        {
            shape.filled = false;
        }

        if (this._stroke && this._strokeWeight > 0) {
            shape.strokeColor = this._strokeColor;
            shape.strokeWeight = this._strokeWeight;
        } else {
            shape.stroked = false;
        }
        shape.style.width = w + 'px';
        shape.style.height = h + 'px';
        if (fillProps) {
            shape.filled = true;
            shape.appendChild(this.getFill());
        }

        this._vml.appendChild(shape);
        this._clearPath();
    },

    getFill: function() {
        var fill = this._createGraphicNode("fill"),
            w = this._width,
            h = this._height,
            fillProps = this._fillProps,
            prop,
            pct,
            i = 0,
            colors,
            colorstring = "",
            len,
            ratios,
            hyp = Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2)),
            cx = 50,
            cy = 50;
        if(this._gradientBox)
        {
            cx= Math.round( (this._gradientBox.width/2 - ((this._x - this._gradientBox.tx) * hyp/w))/(w * w/hyp) * 100);
            cy = Math.round( (this._gradientBox.height/2 - ((this._y - this._gradientBox.ty) * hyp/h))/(h * h/hyp) * 100);
            fillProps.focussize = (this._gradientBox.width/w)/10 + " " + (this._gradientBox.height/h)/10;
        }
        if(fillProps.colors)
        {
            colors = fillProps.colors.concat();
            ratios = fillProps.ratios.concat();
            len = colors.length;
            for(;i < len; ++i) {
                pct = ratios[i] || i/(len-1);
                pct = Math.round(100 * pct) + "%";
                colorstring += ", " + pct + " " + colors[i];
            }
            if(parseInt(pct, 10) < 100)
            {
                colorstring += ", 100% " + colors[len-1];
            }
        }
        for (prop in fillProps) {
            if(fillProps.hasOwnProperty(prop)) {
                fill.setAttribute(prop, fillProps[prop]);
           }
        }
        fill.colors = colorstring.substr(2);
        if(fillProps.type === "gradientradial")
        {
            fill.focusposition = cx + "%," + cy + "%";
        }
        return fill;
    },

    end: function() {
        if(this._shape)
        {
            this._drawVML();
        }
        this._initProps();
    },

    lineGradientStyle: function() {
        return this;
    },

    lineStyle: function(thickness, color, alpha, pixelHinting, scaleMode, caps, joints, miterLimit) {
        this._stroke = 1;
        this._strokeWeight = thickness * 0.7;
        this._strokeColor = color;
    },

    lineTo: function(point1, point2, etc) {
        var args = arguments,
            i,
            len;
        if (typeof point1 === 'string' || typeof point1 === 'number') {
            args = [[point1, point2]];
        }
        len = args.length;
        this._shape = "shape";
        this._path += ' l ';
        for (i = 0; i < len; ++i) {
            this._path += ' ' + args[i][0] + ', ' + args[i][1];

            this._trackSize.apply(this, args[i]);
        }
    },

    moveTo: function(x, y) {
        this._path += ' m ' + x + ', ' + y;
    },

    setSize: function(w, h) {
        this._vml.style.width = w + 'px';
        this._vml.style.height = h + 'px';
        this._vml.coordSize = w + ' ' + h;
    },
    
    /**
     * @private
     * Creates a vml node.
     */
    _createGraphicNode: function(type)
    {
        return document.createElement('<' + type + ' xmlns="urn:schemas-microsft.com:vml" class="vml' + type + '"/>');
    
    },

    render: function(node) {
        var w = node.offsetWidth,
            h = node.offsetHeight;
        node = node || Y.config.doc.body;
        node.appendChild(this._vml);
        this.setSize(w, h);
        this._initProps();
        return this;
    }
};

if (Y.UA.ie) {
    var sheet = document.createStyleSheet();
    sheet.addRule(".vmlgroup", "behavior:url(#default#VML)", sheet.rules.length);
    sheet.addRule(".vmlgroup", "display:inline-block", sheet.rules.length);
    sheet.addRule(".vmlgroup", "zoom:1", sheet.rules.length);
    sheet.addRule(".vmlshape", "behavior:url(#default#VML)", sheet.rules.length);
    sheet.addRule(".vmlshape", "display:inline-block", sheet.rules.length);
    sheet.addRule(".vmloval", "behavior:url(#default#VML)", sheet.rules.length);
    sheet.addRule(".vmloval", "display:inline-block", sheet.rules.length);
    sheet.addRule(".vmlrect", "behavior:url(#default#VML)", sheet.rules.length);
    sheet.addRule(".vmlrect", "display:block", sheet.rules.length);
    sheet.addRule(".vmlfill", "behavior:url(#default#VML)", sheet.rules.length);
    Y.log('using VML');
    Y.Graphic = VMLGraphics;
}

