/*********************************************************************
  NGraphX 
  Your knowledge in a graph! 
  Copyright (C) 2020 Malte Sandschulte studio(at)sandschulte.com
  All rights reserved.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.

************************************************************************/

function newNetwork(){
  jsonData = null;
  toDisplay = null;
  clearGraph();
  jsonData = { "name":"root",
      "id":1,
      "parentId":0,
      "content":"Welcome to NGraphX, use the help button to get started!",
      "contentType":"text",
      "tags":undefined,
      "children":undefined,
      "collapsed":false };

    indexArray.push(1);
    toDisplay = jsonData;
    //Create the lenghts array for the nodeNames
    getNameLengths(jsonData);
    maxNameLength = (Math.max.apply(Math,nameLengths));//+paddingLR;
    drawGraph(true,null);
    centerNode(getD3Node(1).__data__);
}

/** Loads the JSON file the user has chosen from his pc and parses it
 */
function loadNodes(input){
  var reader = new FileReader();
  var file = document.getElementById("chooseJSONFile").files[0];
  reader.readAsText(file,"UTF-8");
  reader.onload = function(evt) {
    jsonData = null;
    toDisplay = null;
    clearGraph();
    jsonData = JSON.parse(evt.target.result);
    //Initialize the data
    getNameLengths(jsonData);
    maxNameLength = (Math.max.apply(Math,nameLengths));
    getAllIDs(jsonData,indexArray);
    conform(jsonData);
    sortChildren(jsonData,true);
    toDisplay = jsonData;
    drawGraph(true);
    centerNode(getD3Node(jsonData.id).__data__);
  }
}

/** Stores our nodes information in the local storage
 */
function storeJSONLocally(){
    localStorage.setItem('localNodes',JSON.stringify(jsonData));
  }

/** Tries to read nodes out of the local storage and if that results in no data - first use , or cleared local storage -
 *  simply creates a single root note and displays that
 */
function initializeData() {
    var tData = localStorage.getItem('localNodes');
    if(tData == null) {
      //If there is no data we create a root node for the network
      jsonData = { "name":"root",
      "id":1,
      "parentId":0,
      "content":"Welcome to NGraphX, use the help button to get started!",
      "contentType":"text",
      "tags":undefined,
      "children":undefined,
      "collapsed":false };
      indexArray.push(1);
      toDisplay = jsonData;
    }
    else {
      jsonData = JSON.parse(tData);
      //construct the index array for the network
      getAllIDs(jsonData,indexArray);
      //Sort the children arrays alphabetically once  
      sortChildren(jsonData,true);
      toDisplay = jsonData;
    }
    //Create the lenghts array for the nodeNames
    getNameLengths(jsonData);
    maxNameLength = (Math.max.apply(Math,nameLengths));//+paddingLR;
    drawGraph(true,null);
    //attachClickFunction();
    centerNode(getD3Node(1).__data__);
}

/** This function builds an array with the lenghts of all node names in it. This way we can easily check which is the longest node name and 
 * base the node size on that. 
 * @param {Node} startNode Node to start length analysis at 
 */
function getNameLengths(startNode){
  if(!startNode){return;}
  nameLengths.push(Math.floor(getTextWidth(startNode.name,"normal 16px Arial")));
  
  var child;
  var collapsed = startNode.collapsed;
  
  if(collapsed){
    startNode.children = startNode._children;
  }

  if(startNode.children != undefined){
    for(child of startNode.children){
      getNameLengths(child);
    }
  }

  if(collapsed){
    startNode._children = startNode.children;
    startNode.children = undefined;
  }
}

/**Traverses the specified nodes starting with startNode and returns the object with the specified id 
 * if this is found. If not returns undefined
 * 
 * @param {node} startNode first node of hierarchy to traverse
 * @param {node} id node Id to look for
 */
function findNodeWithID(startNode, id) {
  if(!startNode){ return; }

  if (startNode.id == id) {
      //console.log(startNode.id + " found at node with name " + startNode.name);
      return startNode;
  }
  var collapsed = startNode.collapsed;
  if(collapsed) {
    startNode.children = startNode._children;
  }
  // Now we need to recursively check all nodes until we find the one with the desired id 
  if (startNode.children)
  {
      //Recursively check this child against id - all it's children will also be checked
      for(child of startNode.children){
          childRes = findNodeWithID(child,id);
          // If findNode returns a valid object it will be the object with the specified id
          if(childRes != undefined){
                  return childRes;
          }
      }
  }
  if(collapsed){
    startNode._children = startNode.children;
    startNode.children = undefined;
  }

  return undefined;
}

/**Conforms the data to the current status quo and makes sure that mistakes in the file are corrected befre loading. 
 * E.g collapsed = true although nodes have no children etc. 
 * @param {Node} StartNode The node to start conforming at. Recursive on all children by default.
 */
function conform(startNode){
  if(!startNode){return;}

  //Some basic sanity checks which are not recuperable 
  if(!startNode.hasOwnProperty("id")){
    window.alert("This file does not seem to be a valid NGX file. Reason: No Id property found");
    throw("Could not read this file - id property of node missing.");
  }

  if(!startNode.hasOwnProperty("parentId")){
    window.alert("This file does not seem to be a valid NGX file. Reason: No parentId property found");
    throw("Could not read this file - parentId property of node missing.");
  }

  //Check for all required properties
  if(!startNode.hasOwnProperty("collapsed")){
    startNode.collapsed="false";
  }


  //Make the children data accessible to us
  var collapsed = toggleChildrenArrays(startNode,false);

  //Check that a node that has no children has collapsed set to false
  if(!hasChildren(startNode)){
    startNode.collapsed = false;
  }
  
  
  //Call recursively 
  if(hasChildren(startNode)){
    for(c of startNode.children){
      conform(c);
    }
  }

  //Recollapse children data if it was collapsed before
  if(collapsed){
    toggleChildrenArrays(startNode,true);
  }

}
/** Takes the highest ID NUmber found in the current node hierarchy and increments it by one, delivering us a fresh id to use
* We could save a lot of recursion by building this array once at programm startup and then just adding to it the right way! 
**/
function getUnusedID(){
  var newId = (Math.max.apply(Math,indexArray))+1;
  indexArray.push(newId);
  return newId;
}

/** Recursive function that adds all nodes ids to the passed idArray. We do this once at startup so that we know which id's are 
 * already used up. It would be nice to create a "cleanup" function that makes the id's sequencial again. 
 * @param {Node} startNode Node where we start building the id array - root! 
 * @param {Array} idArray Array to put IDs in 
 **/
function getAllIDs(startNode, idArray) {
  if(!startNode){ return; }
  var collapsed = startNode.collapsed;
  if(collapsed){
    startNode.children = startNode._children;
  }

  idArray.push(startNode.id);
  
  if(startNode.children) {
    for( child of startNode.children) {
      getAllIDs(child, idArray);
    }
  }

  if(collapsed){
    startNode._children = startNode.children;
    startNode.children = undefined;
  }
}

/** Sorts the children array of the specified node in alphabetical order  */
function sortChildren(startNode,recursive){
  if(!startNode){return;}

  //Check if the node is collapsed and if so uncollapse the data
  var collapsed = toggleChildrenArrays(startNode,false);

  if(startNode.children){
    //Sort the children array 
    startNode.children.sort(function(a,b){
      if( a.name < b.name ) { return -1; }
      if( a.name > b.name ) { return 1; }
      else { return 0; }
    });
    //if wished, recurse
    if(recursive){
      for(c of startNode.children){
        sortChildren(c,recursive);
      }
    }
  }
  //Set arrays back to collapsed
  if(collapsed){
    toggleChildrenArrays(startNode,true);
  }
}

/** Toggles the collapsed state of data and renames the children arrays accordingly so that our functions that 
 * access the node.children array work fine
 * @param {Node} node Node whose children arrays are to be changed
 * @param {bool} collapse This specifies what happens with the children arrays, if set to false, we will rename them 
 * so that they seem uncollapsed (this is what we want before executing our functions that operate on children) if set to true
 * they will be "hidden" again and thus not be accessible anymore. To prevent state inconsistencies a node that has the state collapsed
 * = true will have its children under _children - in order to hide them from D3 -
 */
function toggleChildrenArrays(node,collapse){
  if(!node){
    throw "No valid node specified!";
  }
  //If the node is currently collapsed but we need the data uncollapsed
  if(node.collapsed && !collapse){
    node.children = node._children;
    node._children = undefined;
    return true;
  }
  //Node is collapsed but data also needs to be 
  if(node.collapsed && collapse){
    node._children = node.children;
    node.children = undefined;
  }
}

/** Selects a node, handles some UI changes and activates/fills information into the nodeEditor
* @param {Integer} id Id of the node to make selected 
 */
function selectNode(id) {
  //console.log("selectNode()");
  selectedNode = findNodeWithID(jsonData, id);

  if (!selectedNode){
    window.alert("Could not find the specified node, this should never happen! SelectedNode == Undefined");
    //Try to save the day, and make selected node = root
    selectedNode = jsonData;
  }
  //Change the add node button label
  document.getElementById("addNode").value = "Add Child";
 // document.getElementById("startSearch").value = "Go";
  //Activate the node editor
  activateNodeEditor();
  //Let displayNodeInfo do the updating the UI for the node editor
  displayNodeInfo();    
}

/** Switches selection to the parent node on arrow up press */
function selectParentNode(){
  if(selectedNode){
      var node = getD3Node(selectedNode.parentId);  
      activateNode(node.__data__,node);
      centerNode(node.__data__);
    }
}

/** Switches selection to first child node on arrow down press */
function selectChildNode(){
  if(selectedNode){
    var node = getD3Node(selectedNode.id);
    //If is collapsed uncollapse the data so we can navigate it
    if(selectedNode.collapsed){
      toggleCollapseNode(node.__data__);
    }
    //Make first child node the selected node
    if(selectedNode.children){
      var cNode = getD3Node(selectedNode.children[0].id);
      activateNode(cNode.__data__,cNode);
      centerNode(cNode.__data__);
    }
  }
}

/** Switches selection to sibling to the left  */
function selectSibling(direction){
  if(selectedNode){
    var parentNode = findNodeWithID(jsonData,selectedNode.parentId);
    if(parentNode){
      //Can the parent node be collapsed in this state!? 
      //Find index in children of current node 
      var sni = parentNode.children.indexOf(selectedNode);
      var nni;
      var newSelNode;
      //Since we want to move to the left we reduce the index by one and if we hit 0 we go to the outmost right
      if(direction == "left"){
        nni = sni-1;
        if(nni < 0){ nni = parentNode.children.length-1; }
      }
      //If the index is to high set back to zero e.g. Jump to the leftmost node
      if(direction == "right"){
        nni = sni+1;
        if(nni > parentNode.children.length-1){ nni = 0;}
      }
      try {
        newSelNode = parentNode.children[nni];
        if(newSelNode){
          var cNode = getD3Node(newSelNode.id);
          activateNode(cNode.__data__,cNode);
          centerNode(cNode.__data__);
        }
      }
      catch(err){
        console.log("Could not select sibling!");
      }
    }
  }
}

/** Deselect Node - handles deselecting the node 
 */
function deselectNode(){
  selectedNode = undefined;
  document.getElementById("addNode").value = "Add Node";
  //document.getElementById("startSearch").value = "Go";
  //Calling display node info without a selected node resets the whole editor to default values
  displayNodeInfo();
  //After resetting values deactivate it 
  deactivateNodeEditor();
}

/** This function is executed when the user "accepts" adding a tag by either leaving the focus of the textfield after having typed something
 * or he presses enter after having typed something. This function adds the value of the DOM element as a new tag to the selected node
 */
function addTagToNode() {
  if(!selectedNode) {
    console.log("Error adding tag, there is no selected node");
    return null;
  }
  //get the entered value from the UI
  var tI = document.getElementById("addTagButton");
  var newTagName = tI.value;

  //Add the tag to the node 
  //CHECK FOR DOUBLE TAGS HERE ! 
  if(selectedNode.tags == undefined){
    selectedNode.tags = [];
  }
  selectedNode.tags[selectedNode.tags.length] = {"tag":newTagName};

  //Store json locally
  storeJSONLocally();

  //recreate the tags in the UI  
  createTags();
}

/** Updates the tags for the specified nodes and also triggers an update for all nodes, thus changing the tag
 *  "coding" to "Coding" changes all "coding" tags for all nodes! 
 * @param {String} newTag New value of the tag 
 * @param {DOMElement} oldTag Current "DOM id" of the the tag, the DOM ID is the same as the tag value e.g. "coding"
 */
function updateTagForNode(newTag, oldTag) {
  var el = document.getElementById(oldTag);
  if(!el){
    throw "Couldnt find tag element in the DOM";
  }
  if(!selectedNode){
    throw "No selected node! Something is going wrong here!";
  }
  //Update the tag for this node
  if(selectedNode.tags){
    for(const tag of selectedNode.tags){
      if(tag.tag == oldTag){
        tag.tag = newTag;
      }
    }
  }
  //Now update tag for all nodes in the network
  updateTags(jsonData, newTag, oldTag);
  //recreate tags
  createTags();
}

/** Recursively updates the tags as specified for all nodes in the hierarchy lead by startNode
 * 
 * @param {Node} startNode Node to start with, all children will be considered
 * @param {String} newtag  New tag, that replaces old tag
 * @param {String} oldTag Old tag to replace with new tag
 */
function updateTags(startNode, newTag, oldTag) {
  if(!startNode){ return; }
  //Update current node
  if(startNode.tags) {
    //Tags are inside a json object {"tag":"tagValue"}
    for(const tag of startNode.tags) {
      if(tag.tag == oldTag){
        tag.tag = newTag;
      }
    }
  }

  var collapsed = startNode.collapsed;
  if(collapsed){
    startNode.children = startNode._children;
  }

  //update children
  if(startNode.children) {
    for(const c of startNode.children) {
      updateTags(c, newTag, oldTag);
    }
  }

  if(collapsed){
    startNode.children = undefined;
  }
}

/** This is called when the user ctrl double clicks on a tag button in order to remove it from the node. 
 * @param {Node} tagToDel Tag to delete 
 */
function removeTagFromNode(tagToDel){
  
  if(!selectedNode) {
    throw "Error removing tag, there is no selected node";
  }
  if(!selectedNode.tags){
    throw "Error no tags present in node, cannot delete";
  }
  //Find the index of the tag to delete
  selectedNode.tags.forEach(function(item, index){
    if(selectedNode.tags[index].tag == tagToDel){
      selectedNode.tags.splice(index,1);
    }
  });
  //recreate Tags in UI
  createTags();
}

/** Deletes a node from the node graph. It does this by reparenting all it's possible children to the parent node of the 
 * node to delete. 
 * @param  {Boolean} recursive If set to true deletes the selected node and all it's children.
 */
function deleteNodeFromGraph(recursive) {
  if(!selectedNode){ return; }
 
  var parentNode = findNodeWithID(jsonData,selectedNode.parentId);
  if(!parentNode){
    throw ("Fatal error: no parent found!");
  }

  //Deletes only selected node 
  if(!recursive){
    //Does the node in question have children? , if so make it's children, children of it's parent! 
    //this includes setting the appropriate parentId for the child and adding it to it's new parents array
    toggleChildrenArrays(selectedNode,false);
    var collapsed = toggleChildrenArrays(parentNode,false);

    if(selectedNode.children) {
      for(child of selectedNode.children) {
        //set parent id
        child.parentId = selectedNode.parentId;
        //Add node to parents children array
        parentNode.children[parentNode.children.length] = child;
      }
    }
      
    //remove the node in question from the parentNodes children array
    parentNode.children.forEach(function(item, index){
    if(parentNode.children[index].id == selectedNode.id){
      parentNode.children.splice(index,1);
    }
    });

    //If the parent was collapsed before, restore it to that state. 
    if(collapsed){
      toggleChildrenArrays(parentNode,true);
    }

    //Deactive and clear nodeEditor
    selectedNode = undefined;
    displayNodeInfo();
    deactivateNodeEditor();
    fadeOutNodes();
    //Makre sure the children of the parent node are sorted again so that traversing the nodes still works as expected
    sortChildren(parentNode,false);
    //If we delete a collapsed node the children wont get redrawn into the new hierarchy until the next draw graph call! 
    //drawGraph(true);
  }
  //Delets selected and children of selected
  if(recursive){
    if(window.confirm("Do you really want to delete this whole branch?")){
      //Remove the selected node from parent's children array does the whole job for us since this way the node and it's children 
      //are no longer accessible by any other function
      parentNode.children.forEach(function(item, index){
        if(parentNode.children[index].id == selectedNode.id){
          parentNode.children.splice(index,1);
        }});
      //Deactive and clear nodeEditor
      selectedNode = undefined;
      displayNodeInfo();
      deactivateNodeEditor();
      fadeOutNodes();
    }
    else{
      return;
    }
  }
}

/**
 * Reparents a node to a new parent. Works on the hierarchy. This means that all children of the node to reparent will stay under its parent and
 * thus become grandchildren of the new parent node. 
 * @param {*} nodeID Node to be reparented
 * @param {*} newParentID New parent node for the node to  be reparented
 */
function reparentNode(nodeID,newParentID) {
  //Get us the current parent of the node 
  var node = findNodeWithID(jsonData,nodeID);
  var newParent = findNodeWithID(jsonData,newParentID);
  //Only continue if both are found
  if(node && newParent){
    //Get current parent
    var cP = findNodeWithID(jsonData,node.parentId);
    
    //Make sure that the new parent node is not below the node we are reparenting in the hierarchy! 
    // I think the first check is unecessary since findNodeWithID would return direct children as well 
    // if(node.children.indexOf(newParent) > -1) {
    //   throw ("Cannot parent parent to child, aborting!");
    // }
    //Now recursively check that new parent is not in the downstream hierarchy of this node
    if(findNodeWithID(node,newParent.id) != undefined )
    {
      throw "Cannot parent parent to child of child, aborting!";
    }

    //Remove the node from it's current parent children array
    index = cP.children.indexOf(node);
    if(index > -1) {
      cP.children.splice(index,1);
    }
    //Add the node to the new parent children array
    //If the parent is collapsed the arrays name wont be children but _children
    if(newParent.collapsed == true){
      //If there is already a children array just push to it
      if(newParent._children != undefined) {
        newParent._children.push(node);
      }
      //Else create it first and push then
      else {
        newParent.children = [];
        newParent.children.push(node);
      }
    }
    else{
      //If there is already a children array just push to it
      if(newParent.children != undefined) {
        newParent.children.push(node);
      }
      //Else create it first and push then
      else {
        newParent.children = [];
        newParent.children.push(node);
      }
    }
    //Adjust nodes parent id
    node.parentId = newParent.id;
    return;
  }
  else {
    throw "Couldnt find parent or node! Reparenting aborted";
  }
}

/*#####################################################################################
*
* SEARCH FUNCTIONS 
*
#####################################################################################*/

/** This function converts all node names in the hiearchy headed by Node to lowercase and then looks for the searchString
 * It modififes a specified array to contain the search results. 
 * @param {Node} node 
 * @param {String} searchString 
 * @param {NodeArray} resultArray 
 */
function nameContains(node, searchString, resultArray){
  if(!node){return;}

  index = node.name.toLowerCase().indexOf(searchString.toLowerCase());
  if(index > -1){
    resultArray.push(node);
  }

  var collapsed = node.collapsed;
  if(collapsed){
    node.children = node._children;
    node._children = undefined;
  }
  
  //Search in the children
  if(node.children){
    for(c of node.children){
      nameContains(c,searchString,resultArray);
    }
  }
  if(collapsed){
    node._children = node.children;
    node.children = undefined;
  }
}

/**
 * This function searches specified nodes tags for a correspondence to the search term 
 * @param {Node} node to search for tag correspondences in  
 * @param {String} searchString the query string
 * @param {NodeArray} resultArray the results provided by the search
 */
function tagsContain(node, searchString, resultArray){
  if(!node){return;}
  
  //If this node has tags, search them, otherwise we continue with its children further below
  if(node.tags != undefined){
    for(tag of node.tags) {
      //if we find a correspondence with this tag 
      var index = tag.tag.toLowerCase().indexOf(searchString.toLowerCase());
      if(index > -1){
        resultArray.push(node);
      }
    }
  }

  var collapsed = node.collapsed;
  if(collapsed){
    node.children = node._children;
    node._children = undefined;
  }
  
  if(node.children){
    for(c of node.children){
      tagsContain(c,searchString,resultArray);
    }
  }

  if(collapsed){
    node._children = node.children;
    node.children = undefined;
  }
}

/**
 * This function searches for the search term in the content of nodes 
 * @param {Node} node to search for tag correspondences in  
 * @param {String} searchString the query string
 * @param {NodeArray} resultArray the results provided by the search
 */
function contentsContain(node, searchString, resultArray){
  if(!node){return;}
  var index = node.content.toLowerCase().indexOf(searchString.toLowerCase());
  if(index > -1){
    resultArray.push(node);
  }
  var collapsed = node.collapsed;
  if(collapsed){
    node.children = node._children;
    node._children = undefined;
  }
  //Searches uncollapsed children
  if(node.children){
    for(c of node.children){
      contentsContain(c,searchString,resultArray);
    }
  }
  if(collapsed){
    node._children = node.children;
    node.children = undefined;
  }
}

/** Finds all nodes in the network that fulfill the criteria
 *  @param {String} Query The Text to look for 
 *  @param {String} SearchMode Which content do we search in? Tags, names, content? Everything? 
 */
function findNodes(query, searchMode){

  var nodesFound = [];
  var searchIn;
  //If we have a selection we only search in that
  //This does not seem to be very good for our usability..
  //if(selectedNode){ searchIn = selectedNode; }
  //otherwise we search all data
  //if(!selectedNode){ searchIn = jsonData; }
  searchIn = jsonData;
  //Determine search mode 
  if(searchMode == "Everything") {
    //searching in everything for me means that: 
    //we search in names, tags and content and rate the results based on findings, so a node that has a correspondence in content and name 
    //is rated higher than a node that only has a content correspondence.
    var nameFound = [];
    var tagFound = [];
    var contentFound = [];
    var rankedList = [];

    nameContains(searchIn,query,nameFound);
    tagsContain(searchIn,query,tagFound);
    contentsContain(searchIn,query,contentFound);
  
    for(node of nameFound){
      rankedList.push({"node":node,"score":1});
    }
    //Check which node was already inside rankedList and increase scores or add them
    for(node of tagFound){
      var exists = false;
      rankedList.forEach(function(element){
        if(element.node.id == node.id) {
          element.score++; 
          exists = true; 
        }
      });
      //If the element was not found inside the rankedList add it now
      if(exists == false){
        rankedList.push({"node":node,"score":1});
      }
    }
    //Repeat scoring process for nodes found via content
    for(node of contentFound){
      var exists = false;
      rankedList.forEach(function(element){
        if(element.node.id == node.id) {
          element.score++; 
          exists = true; 
        }
      });
      //If the element was not found inside the rankedList add it now
      if(exists == false){
        rankedList.push({"node":node,"score":1});
      }
    }
  
   //Sort the ranked list
   rankedList.sort(function(a,b){
    if( a.score > b.score) { return -1;}
    if( a.score == b.score) { return 0;}
    if( a.score < b.score) { return 1;}
   });
   //Temporary fix, create new array until we have better way 
   var ar = [];
   for(e of rankedList){
     ar[ar.length] = e.node;
   }

   if(rankedList.length > 0){
     displayResults(ar);
   }
   else{
     window.alert("No results for this query");
     var sB = document.getElementById("searchInput");
     if(sB){
       sB.focus();      
     }
   }
  }

  if(searchMode == "Names"){
    nameContains(searchIn,query,nodesFound);
    if(nodesFound.length > 0){
      displayResults(nodesFound);
    }
    else{
      window.alert("No results for this query");
      var sB = document.getElementById("searchInput");
      if(sB){
        sB.focus();      
      }
    }
  }

  if(searchMode == "Tags"){
    tagsContain(searchIn,query,nodesFound);
    if(nodesFound.length > 0) {
      displayResults(nodesFound);
    }
    else{
      window.alert("No results for this query");
      var sB = document.getElementById("searchInput");
      if(sB){
        sB.focus();      
      }
    }
  }

  if(searchMode == "Content"){
    contentsContain(searchIn,query,nodesFound);
    if(nodesFound.length > 0) {
      displayResults(nodesFound);
    }
    else{
      window.alert("No results for this query");
      var sB = document.getElementById("searchInput");
      if(sB){
        sB.focus();      
      }
    }

  }
}

/** Collapses all nodes recursively starting at startNode
 * @param {Node} startNode Starting node for the recursion
 */
function collapseAll(startNode){
  if(!startNode) { return; }
  if(!hasChildren(startNode)){
    return;
  }

  startNode.collapsed = true;
 
  if(startNode.children){
    for(c of startNode.children){
      collapseAll(c);
    }
    startNode._children = startNode.children;
    startNode.children = undefined;
    return;
  }

  if(startNode._children){
    for(c of startNode._children){
      collapseAll(c);
    }
    startNode.children = undefined;
  }
  
}

/** Uncollapses all nodes recursively starting at startNode
 * @param {Node} startNode Starting node for the recursion
 */
function uncollapseAll(startNode){
  if(!startNode) { return; }

  startNode.collapsed = false;

  if(startNode.children){
    for(c of startNode.children){
      uncollapseAll(c);
    }
    startNode._children = undefined;
    return;
  }

  if(startNode._children){
    for(c of startNode._children){
      uncollapseAll(c);
    }
    startNode.children = startNode._children;
    startNode._children = undefined;
  }
}

/** Uncollapses all collapsed parents of targetNode allowing us to display targetNode
 *  used when the user clicks on a search result. To allow display of it, parents need to be uncollapsed.
 * @param {Node} targetNode Node whose parent line is to be uncollapsed
 */
function uncollapsePathToNode(targetNode){
  if(!targetNode){ return; }
  //reached root node
  if(targetNode.id == 1){
    return;
  }
  if(targetNode.collapsed)
  {
    targetNode.collapsed = false;
    targetNode.children = targetNode._children;
    targetNode._children = undefined;
  }
  var parentNode = findNodeWithID(jsonData,targetNode.parentId);
  uncollapsePathToNode(parentNode);

}

/** Checks if the node has children and does this for both collapsed and uncollapsed data states
 * @param {Node} node Node to inspect
 */
function hasChildren(node){
  if(!node){ return false;}
  //if the node is collapsed the _children array will contain data
  if(node._children){
    if(node._children.length > 0){
      return true;
    }
  }
  //if the node is not collapsed the children will contain the data
  if(node.children){
    if(node.children.length > 0)
    {
      return true;
    }
  }
  //If we reach this part, no children are found
  return false;
}

//For debugging we can load external JSON Data by using the getJSON function. This will as well save it in the local storage.
//getJSON();
initializeData();

