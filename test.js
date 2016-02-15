var assert = require("assert");
describe("ReactiveProperty", function() {
  describe("#indexOf()", function () {
    it("should return -1 when the value is not present", function () {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});

var Graph = require("./graph.js");
var debounce = require("./debounce.js");

var graph = new Graph();
var nodeIdCounter = 0;
var changedNodes = {};
var nodes = {};

function digest(){
  var sourceNodes = Object.keys(changedNodes).map(parseInt);
  var ids = graph.topologicalSort(sourceNodes);
  ids.forEach(function (id){
    nodes[id].evaluate();
  });
}

var queueDigest = debounce(digest);

function nodeChanged(node){
  changedNodes[node.id] = true;
  queueDigest();
}

function ReactiveNode(evaluate){
  var node = {
    id: nodeIdCounter++,
    evaluate: evaluate || function (){}
  };
  nodes[node.id] = node;
  return node;
}

function ReactiveProperty(value){
  var node = ReactiveNode();
  var reactiveProperty = function(newValue){
    if(!arguments.length){
      return value;
    } else {
      value = newValue;
      nodeChanged(node);
    }
  };
  reactiveProperty.node = node;
  return reactiveProperty;
}

// ReactiveFunction(dependencies... , callback)
function ReactiveFunction(){

  // Parse arguments.
  var dependencies = [];
  for(var i = 0; i < arguments.length - 1; i++){
    dependencies.push(arguments[i]);
  }
  var callback = arguments[arguments.length - 1];

  var value;

  var node = ReactiveNode(function (){
    var args = dependencies.map(function (d){
      return d();
    });
    value = callback.apply(null, args);
  });

  dependencies.forEach(function (d){
    graph.addEdge(d.node.id, node.id);
  });

  var reactiveFunction = function (){
    return value;
  };

  reactiveFunction.node = node;

  return reactiveFunction;
}


// TODO add as unit tests
//graph.addEdge(1, 2);
//graph.addEdge(2, 3);
//graph.addEdge(3, 4);
//graph.addEdge(4, 7);
//
//graph.addEdge(1, 6);
//graph.addEdge(6, 7);
//
//console.log(graph.topologicalSort([1]));


var a = ReactiveProperty(5);
console.log(a());
a(6);
console.log(a());

var b = ReactiveProperty(10);

var c = ReactiveFunction(a, b, function (a, b){
  return a + b;
});

var d = ReactiveFunction(a, c, function (a, c){
  return a + c;
});

digest();

console.log(c());
console.log(d());

a(0);
digest();

console.log(d());
