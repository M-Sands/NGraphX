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

/* NGraphX uses D3JS by Mike Bostock - for license questions please see /d3/LICENSE or below ->

/***********************************************************************
  D3JS 
  Copyright 2010-2017 Mike Bostock
  All rights reserved.

  Redistribution and use in source and binary forms, with or without modification,
  are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.

  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

  * Neither the name of the author nor the names of contributors may be used to
    endorse or promote products derived from this software without specific prior
    written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
  ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
  ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
****************************************************************************/

/** Get's us a handle to the actually drawn node on the network 
 * @param {integer} id the id of the node we want
 */
function getD3Node(id){
  var sel = d3.selectAll("rect").filter(function(d,i){if(d.data.id == id){return true;} else{return false;}})._groups[0][0].parentNode;
  return sel ? sel : undefined;
}

var linkVertical = d3.linkVertical()
.x(function(d) { return d.x; })
.y(function(d) { return d.y; });

//The drag handler that is applied to all the node groups. Handles functionality for dragging and dropping. 
var dragHandler = d3.drag()
    .on("start", function(d){
      //console.log("start drag");
      
      //IN THEORY i need to stop this event from propagating, but then i cannot select with a click because i stopped the event 
      //before reaching the click. 
      //The solution is to set the pointer events to none when we are REALLY dragging the node...
      d.xO = d.x;
      d.yO = d.y;
      tgtNode = null;
    })

    .on("drag", function(d) {
      //console.log("real Drag");
      //Because dragging a node does not necessarily make it the selectedNode we need to make sure
      //That we have a valid selectedNode before continuing
       if(!selectedNode){
         selectNode(d.data.id);
       }
      //When we are really dragging the node we set the pointer events to none to allow the tgtNode to get the event
      d3.select(this)
        .attr("transform","translate("+d3.event.x+","+d3.event.y+")")
        .attr("pointer-events","none");
      
      //Have the children nodes collapse ONCE - thats why we check if dragging is true already
      if(!dragging){
          //prevent uncollapsing an already collapsed element when we start dragging it! 
          if(d.data.collapsed == false){
            toggleCollapseNode(d);
          }
        }
      //remove parent link
      var nId = d.data.id;
      d3.selectAll("path").filter(function(d){if(d.target.data.id == nId){return true;}return false;}).remove();
      dragging = true;  
      })

    .on("end",function(d) { 
     // console.log("dragend");
      //If we dropped the node on another node this means we want to reparent them
      if(tgtNode != null && tgtNode != d){
        console.log("dropping:"+d.data.name+" on: "+tgtNode.data.name);
        //Implement error checking in case reparenting fails we need to reestablish pointer events as done below!needs catched errors
        try { 
          reparentNode(d.data.id,tgtNode.data.id);
        }
        catch(err) {
          console.log("reparent failed!");
          d3.select(this)
            .attr("pointer-events","auto");
            dragging = false;
        }

        drawGraph(true); 
      }
      //If we didnt drop the node on another node, cancel the reposition
      else{
        d3.select(this)
          .attr("transform","translate("+d.xO+","+d.yO+")");
        drawGraph(true);
      }
      //restore pointer events for the element we dragged around
      d3.select(this)
        .attr("pointer-events","auto");
      dragging = false;
    });

/**
 * The function that handles zooming - it gets called by the D3 zoom Event listener and modifies the attributes 
 * of the svg group with the id transformSvg.
 */
function zoomFunc()
{
  var svgEl = d3.select("#transformSvg");
  svgEl.attr("transform",d3.event.transform)
}

/** Centers the passed node in the view of the graph editor
 *
 * @param {node} source The node to center in view
 */
function centerNode(source) {
  t = d3.zoomTransform(d3.select('#transformSvg').node());
  x = -source.x;
  y = -source.y;
  x = x * t.k + cWidth / 2;
  y = y * t.k + (cHeight / 2);
  d3.select('svg').transition().duration(200).call( zoom.transform, d3.zoomIdentity.translate(x,y).scale(t.k) );
}
/** Updates the global variables required to measure the containers for D3 and the Graph
 */
function updateViewport(){
  offsetViewport = document.getElementById("nodeVis").getBoundingClientRect();
  cWidth = parseInt(offsetViewport.right - offsetViewport.left);
  cHeight = parseInt(offsetViewport.bottom - offsetViewport.top);
}

/**
 * Temporarily enables or disables the children of a node specified by renaming the array to _children
 * 
 * @param {node} node The node who's children are to be collapsed
 */
function toggleChildren(node){
  //Node is currently collapsed so we uncollapse the data
  if(node.data.collapsed){
    if(node._children){
      node.children = node._children;
      node._children = undefined;
    }
    if(node.data._children){
      node.data.children = node.data._children;
      node.data._children = undefined;
    }
    //uncollapseAll(findNodeWithID(jsonData,node.data.id));
    node.data.collapsed = false;
    return;
  }
  //Node is currently uncollapsed collapse the data
  if(!node.data.collapsed){
    if(node.children){
      node._children = node.children;
      node.children = undefined;
    }
    if(node.data.children){
      node.data._children = node.data.children;
      node.data.children = undefined;
    }
    //Collapse all the children
    //collapseAll(findNodeWithID(jsonData,node.data.id));
    node.data.collapsed = true;
  }
 
  return node;
}

/** Toggles between collapsed and uncollapsed states of a specified node and updtes the portion of the graph required
 * 
 * @param {object} node The node who's children are to be collapsed/uncollapsed
 */
function toggleCollapseNode(node){
  // console.log("toggleCollapseNode");
  //if the node does not have children, we do not collapse it ! 
  if(!hasChildren(findNodeWithID(jsonData,node.data.id))){
    console.log("Attempting to collapse childrenless node!");
    return;
  }
  toggleChildren(node);
  
  //Adjust styling for the node 
  if(node.data.collapsed){
      var parentEl = getD3Node(node.data.id);
      parentEl.classList.add("collapsedGroup");
  }

  if(!node.data.collapsed){
    var parentEl = getD3Node(node.data.id);
    parentEl.classList.remove("collapsedGroup");
    }

  drawGraph(true,node);
}

/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 * 
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 * 
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
function getTextWidth(text, font) {
  // re-use canvas object for better performance
  var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  var context = canvas.getContext("2d");
  context.font = font;
  var metrics = context.measureText(text);
  return metrics.width;
}

function clearGraph(){
      nodeGroup = d3.select("svg g .nodes ");
      linkGroup = d3.select("svg g .links");
      d3.select("#transformSvg").attr("transform","translate(0,0) scale(1)");
      nodeGroup.selectAll("g").remove();
      linkGroup.selectAll("pathA").remove();
}

/**
 * Appends svg elements, svg groups, and creates the whole graph before it can be displayed. 
 * 
 * @param {boolean} clear Should the function clear the svg node and link groups? and thus delete everything, e.g. do a clear redraw?
 */
function drawGraph(clear,source) {
  //console.log("drawGraph");

  //Update globals
  updateViewport();
  
  var svgContainer;
  var nodeGroup;
  var linkGroup;
  root = d3.hierarchy(toDisplay);
  root.x = cWidth/2;
  root.y = cHeight/2;
  treeLayout = d3.tree();
  treeLayout.nodeSize([maxNameLength+paddingLR,"100"]);
  //treeLayout.size([10000,10000]);
  // treeLayout.separation(function(a,b){
  //   return 1;
  // });
  root
    .each(function(d){
      d.tWidth =  Math.floor(getTextWidth(d.data.name,"normal 16px Arial"));
    })
    .sort(function(a, b) {
        return b.data.name.toLowerCase() < a.data.name.toLowerCase() ? 1 : -1;
       });
    
  treeLayout(root);

  //Initially create the svg container if it doenst exist so far
  if(document.getElementById("svg") == null){
    svgContainer = d3.select("#svgContainer")
      .append("svg")
      .attr("id","svg")
      .attr("preserveAspecRatio","xMinYMin meet")
      .attr("viewBox",("0 0 "+cWidth+" "+cHeight))
      //We call the zoom event on the svg but the zoom event modifies the underlying transformSvg
      .call( zoom = d3.zoom().on("zoom",zoomFunc))
      //.call(zoom.transform, d3.zoomIdentity.translate(cWidth/2, 40).scale(1))
      .append("g")
      .attr("id","transformSvg")
      //.attr("transform", "translate("+cWidth/2+",40)");
      //This adds two non nested groups to thetransformed group
      //and stores them in variables for later referencing
      linkGroup = svgContainer.append("g")
        .classed("links",true)
        .attr("id","nodeLinksGroup");
      nodeGroup = svgContainer.append("g")
        .classed("nodes",true)
        .attr("id","nodesGroup");
     
    //Disable dblclick zoom, this is very important for our other dbl click events to work  
     d3.select('#svgContainer svg').on("dblclick.zoom",null); 
    // zoom.translateBy(d3.select('#transformSvg'),cWidth/2,40);
    //centerNode(root);
  }
  // in case the container already exists, just get us some references to it! 
  else {
    svgContainer = d3.select("svg g.nodes");
    nodeGroup = d3.select("svg g .nodes ");
    linkGroup = d3.select("svg g .links");
  }

  const t = svgContainer.transition()
        .duration(500);

  // We require the KEY Function here (return d.data.id) because otherwise D3 cannot maintain consistency between 
  // DOM Nodes and Data points. This uses the actual data.id as key for the data array
  var selection = nodeGroup.selectAll("g")
    .data(root.descendants(),function(d){return d.data.id;})
    .join(
      enter => 
      { var g = enter
        .append("g")
        .classed("unselectedGroup",function(d) {
          if(selectedNode){
            if(selectedNode.id == d.data.id) {
              return false;
            }
            else { return true; }
          }
         else { return true; }
        })
        .classed("selectedGroup",function(d) {
          if(selectedNode) {
            if(selectedNode.id == d.data.id)  {
              return true;
            }
          }
          else { return false; }
        })
        
        //Added a styling for groups that are collapsed
        .classed("collapsedGroup",function(d){
          if(d.data.collapsed){
            return true;
          }
          else { return false;}
        })
        
        //place the nodegroup at the parents position
        .attr("transform",function(d) {
          if(selectedNode){
              var parent = d3.selectAll("rect").filter(function(d,i){if(d.data.id == selectedNode.id){return true;} else{return false;}});
              try{
                parent = parent._groups[0][0].parentNode;
                return "translate("+parent.transform.animVal[0].matrix["e"]+","+parent.transform.animVal[0].matrix["f"]+")";
              }
              catch(err){
                console.log("noParent");
              }
              //return "translate("+parent.transform.animVal[0].matrix["e"]+","+parent.transform.animVal[0].matrix["f"]+")";
              return "translate("+d.x+","+d.y+")";
          }
          else{
            return "translate("+d.x+","+d.y+")";
          }
        })
        
         //make them transition to their position
        .call(enter => enter.transition(t)
          .attr("transform",function(d) {
            return "translate("+d.x+","+d.y+")";
            })
          
          );
      //Background rectangle for the node 
      g.append("rect")
        .on("mouseover",function(d){
          mouseOverNode(d,this.parentNode);
        })
        .on("mouseout",function(d) {
          mouseOutNode(d,this.parentNode);
        })
        .attr("rx",5)
        .attr("ry",5)
        .attr("width",function(d) {
          return d.tWidth + paddingLR;
        })
        .attr("height",34)
        .attr("transform",function(d){
          return "translate(-"+((Math.floor(d.tWidth/2))+paddingLR/2)+",-20)";
        })
        .attr('id',function(d){return d.data.id;})
        .on("click", function(d) {
          activateNode(d,this.parentNode);
        })
        //Double clicking a node shows its section of the graph including parents
        .on("dblclick",function(d) {
          //Double click with control pressed removes a node
          if(d3.event.ctrlKey) {
            deleteNodeFromHierarchy();
            return;
          }
          /*
          //If double clicked  a node with shift pressed we isolate view
          if(d3.event.shiftKey) {
            selectNode(d.data.id);
            toDisplay = findNodeWithID(jsonData,selectedNode.parentId);
            drawGraph(true);
            return;
            
          }*/
          //On double click
          toggleCollapseNode(d);
        });
      //Add the text on top of the rect    
      g.append("text")
        //relative positioning of the text inside its parent element
        .attr("transform",function(d) {
          return("translate(-"+Math.floor(d.tWidth/2)+",3)");
        })
        .text(d => d.data.name);
      },//END OF THE ARROW FUNCTION BODY

      update => { 
        update
        //This updates the nodeGroups position after the tree has been collapsed / uncollapsed 
        //this is required to update all groups after changing something in the tree
        .call(update => update.transition(t)
          .attr("transform",function(d) {
            return "translate("+d.x+","+d.y+")";
         })
          .delay(50))
      },
      
      exit => {
        exit
          .call(exit => exit.transition(t)
            .attr("transform",function(d) {
              //Exitting the nodes to the position of their parent will only work if we have a selected node
              //There could be cases in which we do not, for these cases we have two options, one is 
              //simply exitting the nodes to d.x d.y (0,0) the other one is finding the parent DOM node 
              //and getting the position from there
              if(selectedNode){
                //try and get the real current position of the selectedNode instead of getting a "saved" position
                var realNode = d3.selectAll("rect").filter(function(d,i){if(d.data.id == selectedNode.id){return true;} else{return false;}});
                //return "translate("+d.x+","+d.y+")";
                return "translate("+realNode._groups[0][0].parentNode.__data__.x+","+realNode._groups[0][0].parentNode.__data__.y+")";
              }
              else {
                //PROBLEM WITH JUMPING NODES HERE 
                //If we find the dom parent of el we can pass that x and y coords.
                var el = this;
                return "translate("+d.x+","+d.y+")";
              }
            })
            .remove()
            )
       } 
      ); //) join

      var links = linkGroup.selectAll("path")
      .data(root.links(),function(d){return d.target.data.id;})
      .join(
        enter => {enter
          .append('path')
          .classed('link', true)
          .call(enter => enter.transition(t)
          .delay(300)
          .attr("d",d3.linkVertical()
            .x(function(d){return d.x})
            .y(function(d){return d.y})
            )
          
          )
        },
        update => {update
          .call(update => update.transition(t)
            .attr("d",linkVertical)
            .delay(150)
            )
        },
        exit => {exit
          .call(exit => exit.transition(t)
            .attr("d",linkVertical)
            .remove()
          )
        }
      );
  
  var selection = nodeGroup.selectAll("g")
    .classed("collapsedGroup",function(d){
      if(d.data.collapsed){
        return true;
      }
      else { return false;}
    });
  
  dragHandler(nodeGroup.selectAll("g"));
}

function fadeOutNodes()
{
  root = d3.hierarchy(toDisplay);
  root.x = cWidth/2;
  root.y = cHeight/2;
  treeLayout = d3.tree();
  treeLayout.nodeSize([maxNameLength,"100"]);
  root
    .each(function(d){
      d.tWidth =  Math.floor(getTextWidth(d.data.name,"normal 16px Arial"));
    })
    .sort(function(a, b) {
        return b.data.name.toLowerCase() < a.data.name.toLowerCase() ? 1 : -1;
       });
    
  treeLayout(root);
  
  svgContainer = d3.select("svg g.nodes");

  const t = svgContainer.transition()
  .duration(200);

  const t1 = svgContainer.transition()
  .duration(800);

  nodeGroup = d3.select("svg g .nodes ");
  linkGroup = d3.select("svg g .links");

  var selection = nodeGroup.selectAll("g")
  .data(root.descendants(),function(d){return d.data.id;})
  .join(
    enter => enter,//END OF THE ARROW FUNCTION BODY
    update => { 
      update
      //This updates the nodeGroups position after the tree has been collapsed / uncollapsed 
      //this is required to update all groups after changing something in the tree
      .call(update => update.transition(t)
        .attr("transform",function(d) {
          return "translate("+d.x+","+d.y+")";
       })
        .delay(50))
    },
    
    exit => {
      exit
      .attr("opacity","100")
        .call(exit => exit.transition(t)
          .attr("opacity","0")
          .remove()
          )
     } 
    ); //) join

    var links = linkGroup.selectAll("path")
      .data(root.links(),function(d){return d.target.data.id;})
      .join(
        enter => enter,
        update => {update
          .call(update => update.transition(t)
            .attr("d",linkVertical)
           // .delay(150)
            )
        },
        exit => {
          exit
          .attr("opacity","100")
          .call(exit => exit.transition(t1)
            .attr("opacity","0")
            .remove()
          )
        }
      );

}

/*
 * Called when the mouse hovers over a node. Changes the css class to hoverNode and sets the tgtNode
 * which is the node that will receive the children if we perform a valid d&d operation.
 * 
 * @param {node} d The D3 Node we are hovering over
 * @param {element} node The DOM element pertaining to the node
 */
function mouseOverNode(d,node) {
 // console.log("mouseOverNode");
  //Set target node to the node that has gotten focus - important because this is where the Drag nd Drop target is set! 
  tgtNode = d;
  var n = d3.select(node);
  n.classed("selectedGroup",false);
  n.classed("unselectedGroup", false);
  n.classed("hoverNode", !n.classed("hoverNode"));
}

/**
 * Called when the mouse exits a node. Changes the css style to unselectedGroup or selectedGroup depending on whether we exit the 
 * selected node or not. 
 * @param {node} d The D3 Node we exited with the mouse
 * @param {element} node The DOM Element pertaining to that node
 */
function mouseOutNode(d,node) {
  //console.log("mouseOutNode");
  tgtNode = null;
  var n = d3.select(node);
  //If we have a selectedNode and it is that we are mouseOuting...
  if(selectedNode) {
    if(d.data.id == selectedNode.id) {
      n.classed("selectedGroup",true);
      n.classed("hoverNode", !n.classed("hoverNode"));
      return;
    }
    //if we are exitting a node that is not the selected node, we style it unselected
    else{ 
      if(d.data.collapsed){
        n.classed("collapsedGroup",true);
      }
      n.classed("unselectedGroup", true)
      n.classed("hoverNode", !n.classed("hoverNode"));
      return;
    }
  }
  //There is no selected node,so the node we are mouseOuting must be styled as unselected
  else{
    if(d.data.collapsed){
      n.classed("collapsedGroup",true);
    }
    n.classed("unselectedGroup", true)
    n.classed("hoverNode", !n.classed("hoverNode"));
  }
}

/**
 * Changes the style of the clicked node to be selected. Changes CSS and also calls the selectNode() function to make the 
 * clicked node indeed the selected node for the whole application. The parentNode is the one that get's the styles attached to because
 * this way we can style all elements that make up the "node" -> rectangle and text with one class instead of using different classes 
 * for the text and the rectangle. 
 * 
 * @param {node} d The D3 Node we clicked
 * @param {Element} parentNode The DOM parent - svg group - to the node clicked
 */
function activateNode(d,parentNode) {
  /*
  //Destyle everything that was selected before
  d3.select("svg").selectAll("g.nodes").selectAll("g")
    .classed("selectedGroup",false)
    .classed("unselectedGroup",true);
  */
  if(selectedNode){
    var cNode = getD3Node(selectedNode.id);
    if(cNode){
      cNode.classList.remove("selectedGroup");
      cNode.classList.add("unselectedGroup");
      if(cNode.__data__.data.collapsed){
        cNode.classList.add("collapsedGroup");
      }
    }
  }
  //Because of a difference in the data path of the nodes in the case of the search result calling this function 
  //there will be no d.data but the "data" is directly under d.xxx so accessing d.data.id is not feasible if this function needs to work 
  //for both environments. 
  var clickedNodeId;
  if(d.data != undefined){ clickedNodeId = d.data.id; }
  else{ clickedNodeId = d.id; }

  selectNode(clickedNodeId);

  //Restyle the node by applying css styles to the group element encompassing the rectangle and circle making up the node 
  d3.select(parentNode)
    .classed("selectedGroup",true)
    .classed("unselectedGroup",false)
    .classed("collapsedGroup",false);

  //Stop event propagation so that dragging handlers will not interfere with the click working! 
  
  try {d3.event.stopPropagation(); }
  catch (err) {
    return;
  }
}

/**
 * Makes it possible to deselect nodes by clicking into the empty space in the graph editor. Adds event handlers 
 * for adding nodes by shift-clicking in the empty graph editor space
 */
function attachClickFunction() {
  var svg = d3.select("svg");
  svg
  //This onclick function resets all nodes to deselected visualisation state when we click on the svg
  .on("click",function(){
    //Click with shift key to add node 
    if(d3.event.shiftKey){
      addNode_UI();
    }
    else {
      //If shift was not pressed we deselect the node
      svg.selectAll("g .nodes").selectAll("g")
        .classed("selectedGroup",false)
        .classed("unselectedGroup",true)
        .classed("collapsedGroup",function(d){
            if(d.data.collapsed){
              return true;
            }
            else { return false; }
        });
      //Make no node selected!
      //console.log("clicking on svg");
      deselectNode(); 
      }
  });
}

/**
 * Displays the search results - basically an unconnected row and column display 
 */

 function drawResults() {
  var svgContainer;
  var nodeGroup;

  
  svgContainer = d3.select("svg g.nodes");
  nodeGroup = d3.select("svg g .nodes ");
  linkGroup = d3.select("svg g .links");
  //Delete contents of groups so far
  d3.select("#transformSvg").attr("transform","translate(0,0) scale(1)");
  nodeGroup.selectAll("g").remove();
  linkGroup.selectAll("path").remove();

  var columns = Math.floor(cWidth / maxNameLength);
  var rows = Math.floor(cHeight / 100);  
  var selection = nodeGroup.selectAll("g").data(toDisplay);

  var g = selection.enter()
  .append("g")
  .classed("unselectedGroup",true)
  .attr("transform",function(d) {
    //var columns = Math.floor(cWidth / maxNameLength);
    //var rows = Math.floor(cHeight / 100);
    var node = findNodeWithID(jsonData,d.id);
    var index = (toDisplay.indexOf(node));
    if(index > -1){
      var positionRow = Math.floor(index/columns);
      var positionColumn = (index/columns) % 1;
      //there is no row 0, so always add one to row
      if(positionRow == 0){ positionRow +1;}
      if(positionColumn == 0){ positionColumn +1; }
      return "translate("+Math.floor(positionColumn*cWidth)+","+Math.floor(positionRow*100)+")";
    }
  });

g.append("rect")
  .attr("rx",5)
  .attr("ry",5)
  .attr("width",function(d) {
    return Math.floor(getTextWidth(d.name,"normal 16px Arial") + paddingLR);
  })
  .attr("height",34)
  .attr('id',function(d){return d.id;})
  .on("click", function(d) {
    activateNode(d,this.parentNode);
  })
  //Double clicking a node redisplays the whole tree and centers the dblclicked node in it.
  .on("dblclick",function(d) {
    toDisplay = jsonData;
    clearGraph();
    deselectNode();
    drawGraph(true);
    var domParent = getD3Node(d.id);    
    activateNode(d,domParent);
    centerNode(domParent.__data__);
  });

g.append("text")
  //relative positioning of the text inside its parent element
  .attr("transform","translate(7,19)")
  .text(d => d.name);
  //Center the search results
  t = d3.zoomTransform(d3.select('#transformSvg').node());
  d3.select('svg').transition().duration(200).call( zoom.transform, d3.zoomIdentity.translate(10,50).scale(t.k) );
  
}
