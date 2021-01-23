"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = void 0;
const events_1 = require("events");
const Parser_1 = require("../Parser");
const PromiseQueue = require("easy-promise-queue").default;
class Query extends events_1.EventEmitter {
    constructor(parser, baseURI) {
        super();
        this.processedIds = [];
        this.resultIds = new Set();
        this.results = 0;
        this.terminated = false;
        if (parser === null || parser === undefined) {
            this.parser = new Parser_1.Parser();
        }
        else {
            this.parser = parser;
        }
        this.baseURI = baseURI;
        this.taskqueue = new PromiseQueue({ concurrency: 4 });
        this.maxamount = Infinity;
    }
    addResult(id) {
        this.resultIds.add(id);
        if (this.resultIds.size > this.maxamount) {
            this.interrupt();
        }
    }
    query(collectionId, value, session = null, maxamount = Infinity) {
        return __awaiter(this, void 0, void 0, function* () {
            this.maxamount = maxamount;
            let runningQueries = [];
            if (session !== null) {
                let nodes = session.nodes;
                for (let node of nodes) {
                    if (this.terminated) {
                        runningQueries.push([node]);
                    }
                    else {
                        runningQueries.push(this.followChildWithValue(node.currentNodeId, node.relationValue, value, node.level));
                    }
                }
            }
            else {
                // let results = await this.processId(collectionId)
                let results = yield this.addTask(this.taskqueue, this.processIdTask, collectionId, this);
                session = {};
                session.nodes = new Array();
                if (results !== undefined && results !== null) {
                    for (let collection of results.collections) {
                        if (collection.id === collectionId) {
                            for (let viewRootNodeId of collection.views) {
                                runningQueries.push(this.recursiveQueryNodeInitial(viewRootNodeId, value, this.getInitialSearchValue(), 0, results));
                            }
                        }
                    }
                }
            }
            yield Promise.all(runningQueries);
            if (session === null || session === undefined) {
                session = {};
                session.nodes = [];
            }
            if (session.nodes === null) {
                session.nodes = [];
            }
            let nodeList = [];
            for (let nodes of yield (runningQueries)) {
                for (let node of yield (nodes)) {
                    nodeList.push(yield (node));
                }
            }
            session.nodes = nodeList;
            return session;
        });
    }
    recursiveQueryNodeInitial(currentNodeId, value, followedValue, level, results) {
        return __awaiter(this, void 0, void 0, function* () {
            this.handleEmittingMembers(results, currentNodeId, followedValue, level);
            return yield this.followChildRelations(currentNodeId, results.nodes, value, followedValue, level + 1);
        });
    }
    recursiveQueryNode(currentNodeId, value, followedValue, level) {
        return __awaiter(this, void 0, void 0, function* () {
            // let results = await this.processId(currentNodeId)
            if (this.terminated) {
                return [{ currentNodeId: currentNodeId, value: value, relationValue: followedValue, level: level }];
            }
            let results = yield this.addTask(this.taskqueue, this.processIdTask, currentNodeId, this);
            if (this.terminated || results === undefined || results === null) {
                return [{ currentNodeId: currentNodeId, value: value, relationValue: followedValue, level: level }];
            }
            this.handleEmittingMembers(results, currentNodeId, followedValue, level);
            return yield this.followChildRelations(currentNodeId, results.nodes, value, followedValue, level + 1);
        });
    }
    // async processId(id : any){
    //   if (this.terminated || this.processedIds.indexOf(id) !== -1) { return null }
    //   return await this.parser.process(id)
    // }
    processIdTask(id, query) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (query.terminated || query.processedIds.indexOf(id) !== -1) { return null }
            let processed = yield query.parser.process(id);
            if (processed === undefined || processed === null) {
                processed = null;
            }
            else {
                query.processedIds.push(id);
            }
            return processed;
        });
    }
    handleEmittingMembers(results, searchedNodeId, nodeValue, level) {
        for (let node of results.nodes) {
            if (node.id === searchedNodeId) {
                node.level = level;
                node.value = nodeValue;
                this.emit("node", node);
            }
        }
        this.emit("data", results);
        if (nodeValue !== null && nodeValue !== undefined) {
            this.emit("followedRelationValue", nodeValue);
        }
    }
    addTask(taskqueue, fct, ...args) {
        return new Promise(function (outerresolve, outerreject) {
            taskqueue.add(() => {
                return new Promise(function (resolve, reject) {
                    fct(...args).then((e) => resolve(e)).catch((e) => reject(e));
                }).then((e) => { outerresolve(e); }).catch((e) => { outerreject(e); });
            });
        });
    }
    getInitialSearchValue() {
        return null;
    }
    interrupt() {
        this.terminated = true;
    }
    isTerminated() {
        return this.terminated;
    }
}
exports.Query = Query;
//# sourceMappingURL=Query.js.map