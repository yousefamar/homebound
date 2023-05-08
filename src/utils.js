'use strict';

var loadSync = function (url) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, false);
	xhr.send();
	return xhr.responseText;
};

var loadAsync = function (url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.onload =  function () {
		callback(this.responseText);
	};
	xhr.open("GET", url);
	xhr.send();
};


var List = function () {
	this.size = 0;
};

List.prototype.add = function (element) {
	if (element) {
		this.tail = this.tail ? this.tail.next = { e: element } : this.head = { e: element };
		this.size++;
	}
	return this;
};

List.prototype.poll = function () {
	var element = this.head ? this.head.e : undefined;
	if (element) {
		this.head = this.head === this.tail ? this.tail = undefined : this.head.next;
		this.size--;
	}
	return element;
};

List.prototype.remove = function (element) {
	if (!element)
		return false;

	if (this.head === element) {
		this.head = this.head === this.tail ? this.tail = undefined : this.head.next;
		this.size--;
		return true;
	}
	for (var node = this.head.next; node.next.next; node = node.next) {
		if (node.next === element) {
			node.next = node.next.next;
			this.size--;
			return true;
		}
	}
	if (this.tail === element) {
			this.tail = node;
			this.size--;
			return true;
	}

	return false;
};