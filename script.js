class Sticker {
    constructor(parent, key, id, zIndexer) {
        this._elem = document.createElement('textarea');
        this._elem.className = 'sticker';

        this._parent = parent;
        this._parent.appendChild(this._elem);

        this.zIndexer = zIndexer;

        this._initAtopState();
        this._initRelocation();
        this._initRemove();

        this._watchSize();
        this._watchText();

        this._stock = new Stock(key, id);
    }
    create(X, Y, width, height) {
        this._setX(X);
        this._setY(Y);
        this._setWidth(width);
        this._setHeight(height);
        this._setMaxZ()
        this._setText('');

        this._setColor(this._getRandomColor());
        this._elem.focus();
    }
    restore(data) {
        this._setX(data.x);
        this._setY(data.y);
        this._setZ(data.z);
        this._setWidth(data.width);
        this._setHeight(data.height);
        this._setText(data.text);
        this._setColor(data.color);
    }
    _save() {
        let data = {
            x: this._getX(),
            y: this._getY(),
            z: this.getZ(),
            width: this._getWidth(),
            height: this._getHeight(),
            text: this._getText(),
            color: this._getColor(),
        }
        this._stock.save(data);
    }
    _setX(value) {
        this._X = value;
        this._elem.style.left = value + 'px';

        this._save();
    }
    _getX() {
        return this._X;
    }
    _setY(value) {
        this._Y = value;
        this._elem.style.top = value + 'px';

        this._save();
    }
    _getY() {
        return this._Y;
    }
    _setZ(value) {
        this._Z = value;
        this._elem.style.zIndex = value;

        this._save();
    }
    getZ() {
        return this._Z;
    }
    _setMaxZ() {
        let maxZ = zIndexer.getMaxZ();
        if (maxZ !== this.getZ || maxZ === 0) {
            this._setZ(maxZ + 1);
        }
    }
    _setWidth(value) {
        this._width = value;
        this._elem.style.width = value + 'px';

        this._save();
    }
    _getWidth() {
        return this._width;
    }
    _setHeight(value) {
        this._height = value;
        this._elem.style.height = value + 'px';

        this._save();
    }
    _getHeight() {
        return this._height;
    }
    _setText(value) {
        this._text = value;
        this._elem.value = value;

        this._save();
    }
    _getText() {
        return this._text;
    }
    _watchSize() {
        this._elem.addEventListener('mouseup', () => {
            let newWidth = this._elem.offsetWidth;
            let newHeight = this._elem.offsetHeight;

            if (newWidth !== this._getWidth()) {
                this._setWidth(newWidth);
            }
            if (newHeight !== this._getHeight()) {
                this._setHeight(newHeight);
            }
        })
    }
    _watchText() {
        this._elem.addEventListener('blur', () => {
            let newText = this._elem.value;

            if (newText !== this._getText()) {
                this._setText(newText);
            }
        })
    }
    _initAtopState() {
        this._elem.addEventListener('click', () => {
            this._setMaxZ();
        });
        this._elem.addEventListener('dragstart', () => {
            this._setMaxZ();
        });
    }
    _initRelocation() {
        this._elem.draggable = true;

        let correctionX = 0;
        let correctionY = 0;

        this._elem.addEventListener('dragstart', event => {
            correctionX = this._getX() - event.pageX;
            correctionY = this._getY() - event.pageY;
            event.dataTransfer.effectAllowed = 'move';
            setTimeout(() => {
                this._elem.classList.add('hide');
            }, 0);
        });
        this._elem.addEventListener('dragend', event => {
            this._setX(event.pageX + correctionX);
            this._setY(event.pageY + correctionY);
            this._elem.classList.remove('hide');
        });
        this._elem.blur();
    }
    _initRemove() {
        this._elem.addEventListener('mousedown', event => {
            if (event.which == 2) {
                this._parent.removeChild(this._elem);
                this._stock.remove();
                event.preventDefault();
            }
        });
    }
    _getRandomNum() {
        return Math.floor(Math.random() * (255 + 1));
    }
    _getRandomColor() {
        return `rgb(${this._getRandomNum()}, ${this._getRandomNum()}, ${this._getRandomNum()})`
    }
    _setColor(value) {
        this._color = value;
        this._elem.style.border = '1.5px solid ' + value;

        this._save();
    }
    _getColor() {
        return this._color;
    }
}

class ZIndexer {
    constructor() {
        this._stickers = [];
    }
    add(sticker) {
        this._stickers.push(sticker);
    }
    getMaxZ() {
        if (this._stickers.length > 0) {
            let zIndexes = [];

            this._stickers.forEach(sticker => {
                zIndexes.push(sticker.getZ());
            });
            return Math.max.apply(null, zIndexes);
        } else {
            return 0;
        }
    }
}

class Stock {
    constructor(key, id = null) {
        this._storage = new LocalStor(key);
        this._id = id;
    }
    save(value) {
        let data = this._extract();
        data[this._id] = value;
        this._compact(data);
    }
    remove() {
        let data = this._extract();
        delete data[this._id];
        this._compact(data);
    }
    get() {
        let data = this._extract();
        if (data !== undefined) {
            return data[this._id];
        } else {
            return undefined;
        }
    }
    getAll() {
        return this._extract();
    }
    _compact(data) {
        this._storage.save(JSON.stringify(data));
    }
    _extract() {
        let data = this._storage.get();
        if (data === null) {
            return {}
        } else {
            return JSON.parse(data);
        }
    }
}

class LocalStor {
    constructor(key) {
        this._key = key;
    }
    save(data) {
        localStorage.setItem(this._key, data);
    }
    get() {
        return localStorage.getItem(this._key);
    }
}

let key = 'stickers';
let stock = new Stock(key);
let globalData = stock.getAll();
let id = 0;
let zIndexer = new ZIndexer;

for (id in globalData) {
    let sticker = new Sticker(document.body, key, id, zIndexer);
    sticker.restore(globalData[id]);
    zIndexer.add(sticker);
}

window.addEventListener('dblclick', event => {
    id++;
    let sticker = new Sticker(document.body, key, id, zIndexer);
    sticker.create(event.pageX, event.pageY, 150, 200);
    zIndexer.add(sticker);
});

window.addEventListener('dragover', event => {
    event.preventDefault();
});
