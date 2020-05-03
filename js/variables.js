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

//Global Variables 
var jsonData; //complete data collection
var selectedNode; //current selected node 
var toDisplay; //contains nodes to be displayed by the graph editor
var indexArray = []; //contains all indices of currently living nodes in the network, for a new unused id we add 1 to the last value in here 
var nameLengths = [];
var maxNameLength;
var dragging; //true if currently dragging
var tgtNode; //node we dropped th dragged node on
var zoom; //zoom handler
var root; //tree root node 
var treeLayout; //main tree layout
offsetViewport = document.getElementById("nodeVis").getBoundingClientRect();
cWidth = parseInt(offsetViewport.right - offsetViewport.left);
cHeight = parseInt(offsetViewport.bottom - offsetViewport.top);
var paddingLR = 15; //node text padding, added on top of the actual text size