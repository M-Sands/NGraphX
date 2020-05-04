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

/*-----------------------------------
    EVENT LISTENERS
----------------------------------#*/

window.onresize = function() { 
    checkInline(); 
};

/***************************************************************************
 * Focus and Keyboard shortcuts for the editors
 **************************************************************************/
document.getElementById("nodeVis").addEventListener("focusin",function(e){
    focusOn("nodeVis");
});

document.getElementById("nodeVis").addEventListener("keydown",function(e){
    //Press arrow Key up to select parent node
    if(e.key === "ArrowUp"){
        selectParentNode();
    }

    //Press down key to select child nodes 
    if(e.key === "ArrowDown"){
        selectChildNode();
    }

    //navigate siblings to the left
    if(e.key === "ArrowLeft"){
        selectSibling("left");
    }

    //navigate siblings to the right
    if(e.key === "ArrowRight"){
        selectSibling("right");
    }
    
    //Delete node from hierarchy 
    if(e.key === "Delete"){
        //Since we are using keyboard shortcuts, lets keep the user in the loop by automatically selecting the parent of the node
        var pId = selectedNode.parentId;
        var cNode = getD3Node(pId);
        deleteNodeFromHierarchy();
        activateNode(cNode.__data__,cNode);
        centerNode(cNode.__data__);
    }

    // Add node to hierachy
    if(e.key === "Enter"){
        addNode_UI();
    }

    // Collapse node 
    if(e.key === "-"){
        var cNode = getD3Node(selectedNode.id);
        toggleCollapseNode(cNode.__data__);
    }

    // Collapse node 
    if(e.key === "+"){
        var cNode = getD3Node(selectedNode.id);
        toggleCollapseNode(cNode.__data__);
    }

    //Switch to editor
    if(e.key === "e"){
        if(selectedNode){
            focusOn("nodeEditor");
            var nN = document.getElementById("nodeName");
            if(nN){
                nN.focus();
                e.preventDefault();
            }
        }
    }
    //Switch to search bar
    if(e.key === "s"){
        focusOn("toolbar");
        document.getElementById("searchInput").focus();
        e.preventDefault();
    }

});

// document.getElementById("nodeEditor").addEventListener("keydown",function(e){
   
// });

document.getElementById("searchInput").addEventListener("focusin",function(e){
  focusOn("toolbar");
});

document.getElementById("toolbar").addEventListener("keydown",function(e) {
    //Pressing escape will go back to the node Graph
    if(e.key === "Escape"){
        focusOn("nodeVis"); 
        document.getElementById("nodeVis").focus();
    }
});

document.getElementById("searchInput").addEventListener("keydown",function(e) {
    if(e.key === "Enter"){
        //console.log("search started by enter");
        searchNetwork();
        focusOn("searchResults");
    }
    // //Pressing escape will go back to the node Graph
    // if(e.key === "Escape"){
    //     focusOn("nodeVis"); 
    //     document.getElementById("nodeVis").focus();
    // }
});

document.getElementById("resultList").addEventListener("keydown",function(e){
    e.preventDefault();
    if(e.key === "ArrowRight"){
        focusOn("nodeVis");
        //Manually setting focus dose not trigger event listener! 
        document.getElementById("nodeVis").focus();
    }
    //Press arrow Key up to select previous search result
    if(e.key === "ArrowUp"){
       var uL = document.getElementById("resultList");
       var aE = document.activeElement;
       var index = -1;
       for(c of uL.childNodes){
            index++;
            if(c == aE){
                break;
           }
       }
       //If the topmost search result is focused do nothing
       if(index == 0){
           return;
       }
       //If the second or + result is focused, change focus
       if(index > 0){
           uL.childNodes[index-1].focus();
       }
    }
    //Press down key to select next search result
    if(e.key === "ArrowDown"){
        var uL = document.getElementById("resultList");
        var aE = document.activeElement;
        var index = -1;
        for(c of uL.childNodes){
             index++;
             if(c == aE){
                 break;
            }
        }
        //IF we already focus the last child do nothing
        if(index == uL.childNodes.length-1){
            return;
        }
        //If we focus anterior children increase index and focus
        if(index < uL.childNodes.length-1){
            uL.childNodes[index+1].focus();
        }
        }
});

/***************************************************************************************************
*    NODE EDITOR INPUT FIELDS
*    EVENT LISTENERS 
*    Adding three event listeners per editor field, one for losing focus, one for pressing enter and one
*    for getting focus, which adds an outline to the nodeEditor! 
****************************************************************************************************/
document.getElementById("nodeName").addEventListener("focusin",function(e) {
   focusOn("nodeEditor");
});

document.getElementById("nodeName").addEventListener("focusout",function(e) {
    nameChanged(false);
});

document.getElementById("nodeName").addEventListener("keydown",function(e) {
    if(e.key === "Enter") {
        nameChanged(true);
    }
});

document.getElementById("nodeContent").addEventListener("focusin",function(e) {
     focusOn("nodeEditor");
 });

document.getElementById("nodeContent").addEventListener("focusout",function(e) {
    contentChanged();
});

document.getElementById("nodeContent").addEventListener("keydown",function(e) {
    if(e.key === "Enter") {
        contentChanged();
    }
});

/*------------------------------------------------------------------------------------------------
    BUTTON ATTACHMENTS 
-------------------------------------------------------------------------------------------------*/
document.getElementById("startSearch").addEventListener("click", function() { 
    searchNetwork();
    focusOn("searchResults");
    });

document.getElementById("addNode").addEventListener("click", function() { 
    addNode_UI();
    });

document.getElementById("deleteNode").addEventListener("click", function() { 
    deleteNodeFromHierarchy();
    });

document.getElementById("saveLocally").addEventListener("click", function() { 
    saveLocalFile(jsonData.name);
    });

document.getElementById("uploadNodes").addEventListener("click", function() { 
    //Execute the file upload of the hidden element
    document.getElementById("chooseJSONFile").click();
    });

document.getElementById("toggleEditor").addEventListener("click", function() { 
	toggleEditor("nodeEditor");
    });

document.getElementById("newNetwork").addEventListener("click", function() { 
    if(confirm("This will delete all current nodes, are you sure?")){
        newNetwork();
    }
    else{
        return;
    }
    });


//Closes the search results and displays the node editor again
document.getElementById("closeSearchResults").addEventListener("click", function() { 
        //Display the result List
        var rL = document.getElementById("searchResults");
        rL.style.display = "none";
    });


/**********************************************************************
* RESTYLING 
**********************************************************************/
/** Sets the focus classes on the specified elements and defocuses other elements, "focus" is mutually exclusive.
 * @param {String} element The UI Element that should have focus after function execution 
 */
function focusOn(element){
    var nE = document.getElementById("nodeEditor");
    var nV = document.getElementById("nodeVis");
    var sR = document.getElementById("searchResults");
    var tB  = document.getElementById("toolbar");
    
    if(element === "toolbar"){
        //Remove focus class from elements
        if(nE){
            nE.classList.remove("editorFocused");
        }
        if(nV){
            nV.classList.remove("editorFocused");
        }
        if(sR){
            sR.classList.remove("editorFocused");
        }
        //add focus class on elementsa
        if(tB){
            tB.classList.add("editorFocused");
        }
        return true;
    }
    
    if(element === "nodeVis"){
        //remove focus class
        if(nE){
            nE.classList.remove("editorFocused");
        }
        if(tB){
            tB.classList.remove("editorFocused");
        }
        if(sR){
            sR.classList.remove("editorFocused");
        }
        //Add focus to nodevis
        if(nV){
            nV.classList.add("editorFocused");
        }
        return true;
    }

    if(element === "nodeEditor"){
        //Remove focus classes
        if(nV){
            nV.classList.remove("editorFocused");
        } 
        if(sR){
            sR.classList.remove("editorFocused");
        }
        if(tB){
            tB.classList.remove("editorFocused");
        }
        
        //Add class to node Editor for focus
        if(nE){
            //Only give "focus" if active
            if(nE.classList[0] == "nodeEditor") {
                nE.classList.add("editorFocused");
            }
        }
        return true;
    }

    if(element === "searchResults"){
        var rL = document.getElementById("resultList");
        //Remove focus classes
        if(nV){
            nV.classList.remove("editorFocused");
        } 
        if(nE){
            sR.classList.remove("editorFocused");
        }
        if(tB){
            tB.classList.remove("editorFocused");
        } 
        //Add focus 
        if(sR){
            sR.classList.add("editorFocused");
            if(rL){
                rL.childNodes[0].focus();
            }
        }
        return true;
    }

}

/*-----------------------------------
    FUNCTIONALITY FOR THE TOPBAR
    BUTTONS 
----------------------------------#*/


//Allows the user to store the current node network as a json file and also stores it in the local storage
function saveLocalFile(filename) {
    var a = document.createElement("a");
    a.setAttribute("href","data:text/plain;charset=utf-8,"+encodeURIComponent(JSON.stringify(jsonData)));
    a.setAttribute("download",filename);
    a.setAttribute("id","downloadObject");
    a.click();
    a.remove();
    storeJSONLocally();
}

// Toggles the Node Editor on or off by changing it's display style and the gridTemplateColumns of the secondary wrapper that contains it
// This will lead to inline css being generated that we need to delete when resizing the window later on. 
function toggleEditor(editorId)
{
    let visState = window.getComputedStyle(document.getElementById(editorId)).getPropertyValue('display');
    let wWidth = window.innerWidth;
    if(visState == "none"){
        if(wWidth > 700){
            document.getElementById(editorId).style.display = "flex";
            document.getElementById("secondaryWrapper").style.gridTemplateColumns = "40% 60%";
            //For some reason when we hide the nodeEditor the graph takes up to much space vertically
            //to solve this we simply delete the svg element - culprit... - and then redo it
            var svg = document.getElementById("svg");
            var svgContainer = document.getElementById("svgContainer");
            if(svg && svgContainer){
                svgContainer.removeChild(svg);
            }
            drawGraph(true);
            centerNode(getD3Node(1).__data__);
        }
        else{
            document.getElementById(editorId).style.display = "flex";
            document.getElementById("secondaryWrapper").style.gridTemplateColumns = "auto";
        }
    }
    // If editor is currently visible we hide it
    if(visState == "flex")
    {
        document.getElementById(editorId).style.display = "none";
        document.getElementById("secondaryWrapper").style.gridTemplateColumns = "auto";
        //For some reason when we hide the nodeEditor the graph takes up to much space vertically
        //to solve this we simply delete the svg element - culprit... - and then redo it
        var svg = document.getElementById("svg");
        var svgContainer = document.getElementById("svgContainer");
        if(svg && svgContainer){
            svgContainer.removeChild(svg);
        }
        drawGraph(true);
        centerNode(getD3Node(1).__data__);
    }
}

/*-----------------------------------
    EVENT FUNCTIONS
----------------------------------#*/

/** Checks if the secondary wrapper has inline css. The sec. wrapper gets inline css if one of it's children get toggled (editor / graph). Because the inline
* css prevents our media queries from working we need to delete it if it is no longer required
*/
function checkInline(){
    let wWidth = window.innerWidth;
    if(wWidth < 700){
        style = document.getElementById("secondaryWrapper").style.gridTemplateColumns;
        if(style != undefined){
            document.getElementById("secondaryWrapper").style.gridTemplateColumns="";
        }
    }
}


//-----------------------------------
//   USER INTERFACE
//-----------------------------------

/** Activates the node editor by adapting it's css
*/
function activateNodeEditor() {
    document.getElementById("nodeEditor").className="nodeEditor";
    document.getElementById("nodeName").disabled = false;
    document.getElementById("parentName").disabled = true;
    document.getElementById("addTagButton").disabled = false;
    document.getElementById("nodeContent").disabled = false;
}

/** Deactivates the node editor by adapting it's css
*/
function deactivateNodeEditor() {
    var tagButton = document.getElementById("addTagButton");
    document.getElementById("nodeEditor").className="nodeEditorInactive";
    document.getElementById("nodeName").disabled = true;
    document.getElementById("parentName").disabled = true;
    tagButton.disabled = true;
    tagButton.classList.remove("tagButton");
    tagButton.classList.remove("tagButtonPlus");
    tagButton.classList.add("inactiveButton");
    document.getElementById("nodeContent").disabled = true;
    
}

/** Displays the information related to the currently selected node and if the currently selected node is undefined 
*  it clears out all information from the node editor 
*/
function displayNodeInfo() {
    if(selectedNode == undefined) {
        document.getElementById("nodeName").value = "";
        document.getElementById("parentName").value = "";
        clearTags();
        addPlusButton();
        document.getElementById("nodeContent").value = "";
        return;
    }
    else {
        //Display node name
        document.getElementById("nodeName").value = selectedNode.name;
        
        //Display "-" if we currently have root selected, roots parent can not be changed! 
        if(selectedNode.id == 1) {
            document.getElementById("parentName").value = "-";
        }
        else {
            document.getElementById("parentName").value = findNodeWithID(jsonData, selectedNode.parentId).name;
        }

        //Display the nodes tags
        createTags();

        //Content is automatically set to "" if type is == none 
        if(selectedNode.contentType != "none") {
            //Display content depending on type
            if(selectedNode.contentType == "text") {
                document.getElementById("nodeContent").value = selectedNode.content;
            }
            //Other content implementations would come here 
        }
        else {
            document.getElementById("nodeContent").value = "";
        }
    }
}

/** Populates the tag container with the tags currently assigned to selectedNode 
 *  for every tag associated with the node we create a tagButton and set its onClick actions
 *  ctrl clicking for instance removes tags. Single clicking activates tag editing for the clicked 
 * tag.
 */
function createTags() {
    //console.log("createTags");
    var tagCont = document.getElementById("tagContainer");
    var tag;
    var el;
    clearTags();
    if(selectedNode.tags != undefined) {
        for(const tag of selectedNode.tags) {
            el = document.createElement("input");
            el.className="tagButton";
            el.type ="button";
            el.id = tag.tag;
            el.value = tag.tag;
            el.ondblclick = function(e) {
                e.stopPropagation();
                //Press CTRL and DBL Click to remove tag
                if(e.ctrlKey) {
                    removeTagFromNode(this.id);
                }
                //Currently tag modification is not implemented, otherwise it could go here
                else {
                    editTag(this);
                }
            }
            tagCont.appendChild(el);
        }
    }
    //After adding the tags, recreate the "+" button 
    addPlusButton();
}

/** Clears all children of the tagContainer 
 * 
*/
function clearTags() {
    var tagCont = document.getElementById("tagContainer");
    while(tagCont.firstChild){
        tagCont.removeChild(tagCont.lastChild);
    }
}

/** This adds the "+" Button to the tag container that allows for adding more tags to the selected node
*/
function addPlusButton() {
    //console.log("AddPlusButton");
    var tagCont = document.getElementById("tagContainer");
    var pB = document.getElementById("addTagButton");
    if(pB == undefined) {
        pB = document.createElement("input");
    }
    pB.className = "tagButton tagButtonPlus";
    pB.type = "button";
    pB.id = "addTagButton";
    pB.value ="+";
    pB.tabIndex = "2";
    pB.onclick = function(e) { e.stopPropagation(); addTag(); }
    tagCont.appendChild(pB);
    //pB.focus();
}

/** Allows the user to modify an existing tag by making the button an input and then calling an update routine 
 *  that updates all tags for other nodes that use this tag as well. 
 */
function editTag(domTag){
    domTag.type = "input";
    domTag.addEventListener("focusout",function (e) {
        if(this.value!=""){
            updateTagForNode(domTag.value,domTag.id);
        }
        else{
            this.value = domTag.value;
        }
    });
    domTag.onkeydown = function (e) {
        //User pressed enter and confirms adding this tag, add tag to node and restore plus button
        if (e.keyCode === 13) {
            if(this.value != ""){
                updateTagForNode(domTag.value,domTag.id);
            }
            else{
                this.value = domTag.value();
            }
        }
        //User pressed escape and cancels adding this tag, convert this back to the plus button by calling addPlusButton
        if (e.keyCode === 27) {
            this.value = this.id;
            this.type = "button";
            e.stopPropagation();
        }
    }
}

/**This is called when the user clicks "+" on the addTagButton. It restyles the button to be an input and 
* adds some onKeyDown functions for enter and escape pressing.
*/
function addTag() {
    var tagCont = document.getElementById("tagContainer");
    //Get the current plus button and make it an input field
    var pB = document.getElementById("addTagButton");
    pB.type = "input";
    pB.className = "tagButtonInput";
    pB.value = "";
    //remove the onClick from the plus button, this leads to strange beahivour if not removed! 
    pB.onclick ="";
    pB.addEventListener("focusout",function (e) {
        //Prevent accidental empty tags
        if(this.value != ""){
            addTagToNode();
            document.getElementById("addTagButton").focus();
        }
        else{
             tagCont.removeChild(this);
             addPlusButton();
        }
    });
    pB.onkeydown = function (e) {
        //User pressed enter and confirms adding this tag, add tag to node and restore plus button
        if (e.keyCode === 13) {
            if(this.value != ""){
                addTagToNode();
//                addPlusButton();
                document.getElementById("addTagButton").focus();
            }
            else{
                tagCont.removeChild(this);
                addPlusButton();
            }
        }
        //User pressed escape and cancels adding this tag, convert this back to the plus button by calling addPlusButton
        if (e.keyCode === 27) {
            tagCont.removeChild(this);
            addPlusButton();
        }
    }
}

/** Adds a new node either directly below the root node or below the currently selectedNode. This function prepares everything and 
 * creates the object itself assigning values to it. 
*/
function addNode_UI() {
    var nN;
    var parentNode;
    //Without a valid selection we will add a completely new, parentless node to the network
    if(selectedNode == null) {
        activateNodeEditor();
        nN = document.getElementById("nodeName");
        nN.value = "";
        nN.focus();
        document.getElementById("parentName").value="";
        clearTags();
        addPlusButton();
        document.getElementById("nodeContent").value="";
        //No nodes without parent allowed!
        //Highest parent in display will be parent to this new node  
        if(toDisplay != jsonData){
            parentNode = toDisplay;
        }
        else{
            parentNode = jsonData;
        }

        //Give us a object to work with - TODO: Implement content types, for now all is contenType = text, this needs to be adapted later on
        selectedNode = {"name":"","id":getUnusedID(),"parentId":jsonData.id,"content":"","contentType":"text","tags":undefined,"children":undefined,"collpsed":false};
        //If the parent is collapsed we uncollapse 
        if(parentNode.collapsed){
            toggleCollapseNode(getD3Node(parentNode.id));
        }
        if(parentNode.children == undefined){
            parentNode.children = [];
        }
        parentNode.children[parentNode.children.length] = selectedNode;
        
        //Sort children array 
        //sortChildren(parentNode,false);

        storeJSONLocally();
        
        //destyle all selected nodes 
        d3.select("svg").selectAll("g.nodes").selectAll("g")
            .classed("selectedGroup",false)
            .classed("unselectedGroup",true);

        drawGraph(true);
        return;
    }
    //If we have a selection,  we add the new node as a child
    if(selectedNode != null) {
        nN = document.getElementById("nodeName");
        nN.value = "";
        nN.focus();
        document.getElementById("parentName").value= selectedNode.name;
        clearTags();
        addPlusButton();
        document.getElementById("nodeContent").value="";
        //Save the parent node 
        parentNode = selectedNode;
        //Add an empty on which we can work - addTagToNode() for instace requires a valid selectedNode to add tags to! 
        selectedNode = {"name":"","id":getUnusedID(),"parentId":parentNode.id,"content":"","contentType":"text","tags":undefined,"children":undefined,"collapsed":false};
        //If parent is collapsed, we uncollapse it
        if(parentNode.collapsed){
            toggleCollapseNode(getD3Node(parentNode.id));
        }
        //If the array is not yet initialized we do this now
        if(parentNode.children == undefined){
            parentNode.children = [];
        }
        //Add new child to array
        parentNode.children[parentNode.children.length] = selectedNode;
        
        //Sort children array 
        //sortChildren(parentNode,false);
        
        storeJSONLocally();
        
        //destyle all selected nodes 
        d3.select("svg").selectAll("g.nodes").selectAll("g")
            .classed("selectedGroup",false)
            .classed("unselectedGroup",true);

        drawGraph(true);
        
        centerNode(getD3Node(selectedNode.id).__data__);
        return;
    }
}

/** Called when the user moves mouse focus away from the nodeName field or pressed enter while inside it 
 *  This automatically updates the values of the node.
*/
function nameChanged(keyPressed) {
    
    if(selectedNode.name == document.getElementById("nodeName").value){
        //nothing changed abort
        return;
    }
    selectedNode.name = document.getElementById("nodeName").value

    //Safari has trouble with the hacky way of setting transforms on the svg elements, lets try to delete the node - this 
    //will trigger an update through D3 and thus the redraw should work
    var cNode = getD3Node(selectedNode.id);
    var pEl;
    if(cNode){
        pEl = cNode.parentElement;
        pEl.removeChild(cNode);
    }

    //recalculate name lenghts
    getNameLengths(jsonData);
    maxNameLength = (Math.max.apply(Math,nameLengths));

    //Sort parent nodes children array after name change
    var pN = findNodeWithID(jsonData,selectedNode.parentId);
    if(pN){
        sortChildren(pN,false);
    }

    //Update the graph - as long as we use the delete node variant this is ok
    drawGraph();
    centerNode(getD3Node(selectedNode.id).__data__);

    //save json
    storeJSONLocally();
    
    //If the user pressed enter we change focus back to graph - remove "focus" from nodeEditor
    if(keyPressed){
        var el = document.getElementById("nodeEditor");
        if(el){
            el.classList.remove("nodeEditorFocused");
        }
        document.getElementById("svgContainer").focus();
    }
}

/** Called when the user moves mouse focus away from the nodeContent field or pressed enter while inside it 
 *  This automatically updates the values of the node. 
*/
function contentChanged() {
    selectedNode.content = document.getElementById("nodeContent").value;
    storeJSONLocally();
}

/** When the user clicks "Go" to search the network this function determines current UI content and search Parameters
 * provided by UI and then calls the findNodes function that does all the searching inside the data.
 */
function searchNetwork(){
    searchString = document.getElementById("searchInput").value;
    if(searchString == ""){
        throw "I dont perform empty searches! ";
    }
    searchMode = document.getElementById("searchMode").value;
    
    findNodes(searchString,searchMode);
}

/** This displays the search results into the search result area. It hides the nodeEditor, unhides the searchResults
 *  div and then after clearing it out populates it.
 * @param {Array} list Array containing the nodes that the search function returned
 */
function displayResults(list){
    //Display the result List
    var rL = document.getElementById("searchResults");
    rL.style.display = "flex";
    
    //Clear the Result list and then populate it
    var ul = document.getElementById("resultList");
    while(ul.lastChild){
        ul.removeChild(ul.lastChild);
    }

    if(ul){
        list.forEach(function(element){
            var li = document.createElement("li");
            var parentNode, tags, content;
            li.id = element.id;
            li.innerHTML = element.name;
            li.tabIndex=0;
            //Construct the tooltip with the information of the node 
            tags = "";
            if(element.tags){
                for( t of element.tags) {
                    tags += " "+t.tag;
                }
            }
            //if we found the root node we skip searching for parents
            if(element.id != 1){
                parentNode = findNodeWithID(jsonData,element.parentId).name;
            }
            else{ parentNode = "None"; }
            
            var title = ("Child of: "+parentNode+"\nTags: "+tags+"\nContent: "+element.content);
            li.title = title;
            li.onclick = function() {
                //uncollapse all nodes that lead to the clicked one
                uncollapsePathToNode(element);
                //update the graph 
                drawGraph(true);
                var n = getD3Node(this.id);
                activateNode(n.__data__,n);
                centerNode(n.__data__);
            };
            li.addEventListener("keydown",function(e){
                if(e.key === "Enter"){
                    //uncollapse all nodes that lead to the clicked one
                    uncollapsePathToNode(element);
                    //update the graph 
                    drawGraph(true);
                    var n = getD3Node(this.id);
                    activateNode(n.__data__,n);
                    centerNode(n.__data__);
                }
            });
            ul.appendChild(li);
        });
    }

}