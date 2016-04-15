/*Copyright (c) 2013-2016, Rob Schmuecker
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* The name Rob Schmuecker may not be used to endorse or promote products
  derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL MICHAEL BOSTOCK BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
document.oncontextmenu = function ()
{
    return false
};
//同步数据到云端
var ref = new Wilddog("https://wild-snake-19425.wilddogio.com/");
var menuTmpl=$('#menuTmpl').html();
//ref.set({
//    name:"菜单",
//    data:{
//        des:""
//    },
//    children:[
//        {name:"B平台",data:{des:""},active:true},
//        {name:"Hue",data:{des:""},active:false},
//        {name:"C平台",data:{des:""},active:false}
//    ]
//});
// Calculate total nodes, max label length
var totalNodes = 0;
var maxLabelLength = 0;
// variables for drag/drop
var selectedNode = null;
var draggingNode = null;
// panning variables
var panSpeed = 200;
var panBoundary = 20; // Within 20px from edges will pan when dragging.
// Misc. variables
var i = 0;
var duration = 750;
var root;
var scale;
var projects;
var treeData;
var nodeMarginLeft=200;
var centerCount=1;

// size of the diagram
var viewerWidth = $(window).width();
var viewerHeight = $(window).height();

var tree = d3.layout.tree()
    .size([viewerHeight, viewerWidth]);

// define a d3 diagonal projection for use by the node paths later on.
var diagonal = d3.svg.diagonal()
    .projection(function(d) {
        return [d.y, d.x];
    });

$(window).resize(function(){
    viewerWidth = $(window).width();
    viewerHeight = $(window).height();
    //tree = d3.layout.tree()
    //    .size([viewerHeight, viewerWidth]);
    d3.select("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
        .attr("class", "overlay")
        .call(zoomListener);
});
ref.on("value", function(datasnapshot) {
    console.log(datasnapshot.val());
    projects=datasnapshot.val();
    //if(projects){
    //    projects=deepClone(projects,datasnapshot.val());
    //}else{
    //    projects=datasnapshot.val();
    //}

    treeData={name:"暂无选中的项目"};
    projects.children.each(function(item,i){
        if(item.active){
            treeData=item;
        }
    });


    //初始化菜单
    var $menu=$('.menu');
    var menuRender=template.compile(menuTmpl);
    updateMenu();
    function updateMenu(){
        $menu.find('.nav').html(menuRender(projects));
    }

    //$menu.unbind('click');
    //$menu.find('.btn').unbind('click');

    //点击项目
    $menu.on('click','.nav a',function(){
        var index=$(this).attr('data-id');
        projects.children.each(function(item,i){
            item.active=false;
        });
        projects.children[index].active=true;
        updateMenu();

        root=projects.children[index];

        update(root);
        //centerNode(root);

        //同步数据到云端
        var obj=getOriginData(projects);
        ref.set(obj);

        console.log('保存成功！');

    });

    //删除项目
    $menu.on('click','.nav .btn-del',function(){
        var index=$(this).attr('data-id');

        projects.children.removeAt(index);
        updateMenu();

        //同步数据到云端
        var obj=getOriginData(projects);
        ref.set(obj);

        console.log('保存成功！');
        return false;
    });

    $menu.find('.btn-addProject').unbind('click');
    //增加项目
    $menu.find('.btn-addProject').click(function(){
        var $addInput=$menu.find('.input-addProject');
        if($.trim($addInput.val())){
            projects.children.push( {name:$addInput.val(),data:{des:$addInput.val()},active:false});
            updateMenu();

            //同步数据到云端
            var obj=getOriginData(projects);
            ref.set(obj);

            console.log('保存成功！');
            $addInput.val('');
        }else{
            alert('请输入项目名！');
        }
        return false;
    });

    var searchResultObj={name:'搜索结果',data:{size:1},children:[]};

    //初始化搜索
    $searchInput=$('.searchInput');

    $('.searchBtn').click(function(){
        var result;
        if($.trim($searchInput.val())){
            searchResultObj.children=[];
            searchDataByKey(treeData, 'name' , $searchInput.val());
            console.log(searchResultObj);
            searchResultObj.children=searchResultObj.children.filter(function(n) {
                return n ;
            });
            root=searchResultObj;
        }else{
            root=treeData;
        }
        update(root);
        return false;
    });


    // A recursive helper function for performing some setup by walking through all nodes

    function visit(parent, visitFn, childrenFn) {
        if (!parent) return;

        visitFn(parent);

        var children = childrenFn(parent);
        if (children) {
            var count = children.length;
            for (var i = 0; i < count; i++) {
                visit(children[i], visitFn, childrenFn);
            }
        }
    }

    // Call visit function to establish maxLabelLength
    visit(treeData, function(d) {
        totalNodes++;
        maxLabelLength = Math.max(d.name.length, maxLabelLength);

    }, function(d) {
        return d.children && d.children.length > 0 ? d.children : null;
    });


    // sort the tree according to the node names

    function sortTree() {
        tree.sort(function(a, b) {
            return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
        });
    }
    // Sort the tree initially incase the JSON isn't in a sorted order.
    sortTree();

    // TODO: Pan function, can be better implemented.

    function pan(domNode, direction) {
        var speed = panSpeed;
        if (panTimer) {
            clearTimeout(panTimer);
            translateCoords = d3.transform(svgGroup.attr("transform"));
            if (direction == 'left' || direction == 'right') {
                translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                translateY = translateCoords.translate[1];
            } else if (direction == 'up' || direction == 'down') {
                translateX = translateCoords.translate[0];
                translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
            }
            scaleX = translateCoords.scale[0];
            scaleY = translateCoords.scale[1];
            scale = zoomListener.scale();

            if(translateX&&translateY&&scale){
                svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
                d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");

                zoomListener.scale(zoomListener.scale());
                zoomListener.translate([translateX, translateY]);
            }

            panTimer = setTimeout(function() {
                pan(domNode, speed, direction);
            }, 50);
        }
    }

    // Define the zoom function for the zoomable tree

    function zoom() {
        var transformStr='';
        var inputLeft=Number($('.modifyInput').attr('data-x'));
        var inputTop=Number($('.modifyInput').attr('data-y'));
        var inputScale=d3.event.scale;
        if(d3.event.translate && d3.event.scale){
            transformStr="translate(" + (d3.event.translate[0]+inputLeft/10)+"px,"+(d3.event.translate[1]+inputTop/10) + "px) scale(" +inputScale+ ")";
            svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }else if(d3.event.scale){
            transformStr="scale(" + inputScale+ ")";
        }else if(d3.event.translate){
            transformStr="translate(" + (d3.event.translate[0]+inputLeft/10)+"px,"+(d3.event.translate[1]+inputTop/10) + "px)";
        }
        $('.modifyInput').css({
            "transform":transformStr
        });

    }


    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

    function initiateDrag(d, domNode) {
        draggingNode = d;
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
        d3.select(domNode).attr('class', 'node activeDrag');

        svgGroup.selectAll("g.node").sort(function(a, b) { // select the parent and sort the path's
            if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
            else return -1; // a is the hovered element, bring "a" to the front
        });
        // if nodes has children, remove the links and nodes
        if (nodes.length > 1) {
            // remove link paths
            links = tree.links(nodes);
            nodePaths = svgGroup.selectAll("path.link")
                .data(links, function(d) {
                    return d.target.id;
                }).remove();
            // remove child nodes
            nodesExit = svgGroup.selectAll("g.node")
                .data(nodes, function(d) {
                    return d.id;
                }).filter(function(d, i) {
                    if (d.id == draggingNode.id) {
                        return false;
                    }
                    return true;
                }).remove();
        }

        // remove parent link
        parentLink = tree.links(tree.nodes(draggingNode.parent));
        svgGroup.selectAll('path.link').filter(function(d, i) {
            if (d.target.id == draggingNode.id) {
                return true;
            }
            return false;
        }).remove();

        dragStarted = null;
    }

    // define the baseSvg, attaching a class for styling and the zoomListener
    var baseSvg = d3.select("#tree-container").append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
        .attr("class", "overlay")
        .call(zoomListener);

    // Define the drag listeners for drag/drop behaviour of nodes.
    dragListener = d3.behavior.drag()
        .on("dragstart", function(d) {
            if (d == root) {
                return;
            }
            dragStarted = true;
            nodes = tree.nodes(d);
            d3.event.sourceEvent.stopPropagation();
            // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
        })
        .on("drag", function(d) {
            if (d == root) {
                return;
            }
            if (dragStarted) {
                domNode = this;
                initiateDrag(d, domNode);
            }

            // get coords of mouseEvent relative to svg container to allow for panning
            relCoords = d3.mouse($('svg').get(0));
            if (relCoords[0] < panBoundary) {
                panTimer = true;
                pan(this, 'left');
            } else if (relCoords[0] > ($('svg').width() - panBoundary)) {

                panTimer = true;
                pan(this, 'right');
            } else if (relCoords[1] < panBoundary) {
                panTimer = true;
                pan(this, 'up');
            } else if (relCoords[1] > ($('svg').height() - panBoundary)) {
                panTimer = true;
                pan(this, 'down');
            } else {
                try {
                    clearTimeout(panTimer);
                } catch (e) {

                }
            }

            d.x0 += d3.event.dy;
            d.y0 += d3.event.dx;

            var node = d3.select(this);
            if(d.y0&&d.x0){
                node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
            }

            updateTempConnector();
        }).on("dragend", function(d) {
            if (d == root) {
                return;
            }
            domNode = this;
            if (selectedNode) {
                // now remove the element from the parent, and insert it into the new elements children
                var index = draggingNode.parent.children.indexOf(draggingNode);
                if (index > -1) {
                    draggingNode.parent.children.splice(index, 1);
                }
                if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
                    if (typeof selectedNode.children !== 'undefined') {
                        selectedNode.children.push(draggingNode);
                    } else {
                        selectedNode._children.push(draggingNode);
                    }
                } else {
                    selectedNode.children = [];
                    selectedNode.children.push(draggingNode);
                }
                // Make sure that the node being added to is expanded so user can see added node is correctly moved
                expand(selectedNode);
                sortTree();
                endDrag();
            } else {
                endDrag();
            }
        });

    function endDrag() {
        selectedNode = null;
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
        d3.select(domNode).attr('class', 'node');
        // now restore the mouseover event or we won't be able to drag a 2nd time
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
        updateTempConnector();
        if (draggingNode !== null) {
            update(root);
            //centerNode(draggingNode);
            draggingNode = null;

            //同步数据到云端
            var obj=getOriginData(projects);
            ref.set(obj);

            console.log('保存成功！');
        }
    }

    // Helper functions for collapsing and expanding nodes.

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function expand(d) {
        if (d._children) {
            d.children = d._children;
            d.children.forEach(expand);
            d._children = null;
        }
    }

    var overCircle = function(d) {
        selectedNode = d;
        updateTempConnector();
    };
    var outCircle = function(d) {
        selectedNode = null;
        updateTempConnector();
    };

    // Function to update the temporary connector indicating dragging affiliation
    var updateTempConnector = function() {
        var data = [];
        if (draggingNode !== null && selectedNode !== null) {
            // have to flip the source coordinates since we did this for the existing connectors on the original tree
            data = [{
                source: {
                    x: selectedNode.y0,
                    y: selectedNode.x0
                },
                target: {
                    x: draggingNode.y0,
                    y: draggingNode.x0
                }
            }];
        }
        var link = svgGroup.selectAll(".templink").data(data);

        link.enter().append("path")
            .attr("class", "templink")
            .attr("d", d3.svg.diagonal())
            .attr('pointer-events', 'none');

        link.attr("d", d3.svg.diagonal());

        link.exit().remove();
    };

    // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.

    function centerNode(source) {
        scale = zoomListener.scale();
        x = -source.y0;
        y = -source.x0;
        x = x * scale + viewerWidth / 2;
        y = y * scale + viewerHeight / 2;

        if(x&&y&&scale){
            d3.select('g').transition()
                .duration(duration)
                .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");

            zoomListener.scale(scale);
            zoomListener.translate([x, y]);
        }

    }

    // Toggle children function

    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        return d;
    }

    function hideInput(){
        $('.modifyInput').add($('.buttons')).hide();
    }

    function mouseup(d){
        if (d3.event.defaultPrevented) return; // click suppressed

        var $currNode=$(d3.select(this)[0][0]),
            currNodeLeft=$currNode.position().left,
            currNodeTop=$currNode.position().top,
            currNodeWidth=$currNode.width(),
            currNodeHeight=$currNode.height();
        //console.log(d3.event);
        if(d3.event.button==2){
            //右键点击，弹出，增加和删除菜单
            $('.buttons').css({
                left:currNodeLeft,
                top:currNodeTop
            }).show();
            $('.buttons').find('button').unbind('click');

            //新增子节点
            $('.buttons').find('.add').click(function(){
                d.children=d.children?d.children:d.children=[];
                d.children.push({"name":"子节点",data: d.data});

                update(d);
                centerNode(d);

                //同步数据到云端
                var obj=getOriginData(projects);
                ref.set(obj);

                console.log('保存成功！');

                $('.buttons').hide();

                return false;
            });

            //删除子节点
            $('.buttons').find('.del').click(function(){

                var index=d.parent.children.indexOf(d);
                d.parent.children.splice(index, 1);
                d3.set(d.parent.children).remove(d);

                console.log('保存成功！');

                update(d);
                centerNode(d);

                //同步数据到云端
                var obj=getOriginData(projects);
                ref.set(obj);

                $('.buttons').hide();

                return false;
            });

            //导出节点
            $('.buttons').find('.export').click(function(){

                $('#modal-alert').find('.modal-body').html(JSON.stringify(getOriginData(d)));
                $('#modal-alert').modal('show');

                update(d);
                centerNode(d);
                $('.buttons').hide();

                return false;
            });
        }else if(d3.event.button==0){
            //左键点击，修改文字
            if (d3.event.defaultPrevented) return; // click suppressed

            $('.modifyInput').unbind('blur');
            //$('.modifyInput').unbind('change');

            $('.modifyInput').css({
                transform: "translate(" + currNodeLeft+"px,"+currNodeTop + "px)"
                //left:currNodeLeft,
                //top:currNodeTop
                ,
                width:currNodeWidth*(scale*2||1.5),
                height:currNodeHeight*(scale*2||1.5)
            }).val(d.name).attr('data-x',currNodeLeft).attr('data-y',currNodeTop).show();

            //修改文字
            $('.modifyInput').blur(function(){

                if(d.name!=$(this).val()){
                    d.name=$(this).val();
                    console.log('保存成功！');

                    update(d);

                    //同步数据到云端
                    var obj=getOriginData(projects);
                    ref.set(obj);
                    //centerNode(d);
                }

                $(this).hide();
            });

            //update(d);

        }else{
            //中键点击

        }

        d3.event.preventDefault();
        return false;
    }
    function getOriginData(data){
        var dataObj={};
        dataObj.name= data.name;
        dataObj.data= data.data;
        if(data.active){
            dataObj.active= data.active;
        }
        if(data._children){
            dataObj._children=[];
            data._children.each(function(item,i){
                dataObj._children.push(getOriginData(item));
            });
        }
        if(data.children){
            dataObj.children=[];

            for(var i=0;i<data.children.length;i++){
                dataObj.children.push(getOriginData(data.children[i]));
            }
        }
        return dataObj;
    }

    function searchDataByKey(data,key,value){


        if(new RegExp(value,'g').test(data[key])){
            searchResultObj.children.push(data);
        }else if(data.children){
            for(var i=0;i<data.children.length;i++){
                searchResultObj.children.push(searchDataByKey(data.children[i],key,value));
            }
        }

        //return dataObj;
    }
    function circleClick(d) {
        if (d3.event.defaultPrevented) return; // click suppressed
        d = toggleChildren(d);

        update(d);
        //centerNode(d);

        //同步数据到云端
        var obj=getOriginData(projects);
        ref.set(obj);

        return false;
    }

    function update(source) {
        // Compute the new height, function counts total children of root node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        var levelWidth = [1];
        var childCount = function(level, n) {

            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, root);
        var newHeight = d3.max(levelWidth) * 50; // 25 pixels per line
        tree = tree.size([newHeight, viewerWidth]).separation(function(a, b) { return (a.parent == b.parent ? 1 : 2); });

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        nodes.forEach(function(d) {
            d.y = (d.depth * nodeMarginLeft); //maxLabelLength * 10px
            // alternatively to keep a fixed scale one can set a fixed depth per level
            // Normalize for fixed-depth by commenting out below line
            // d.y = (d.depth * 500); //500px per level.
        });

        // Update the nodes…
        node = svgGroup.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .call(dragListener)
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            });

        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            }).on('click', circleClick);

        nodeEnter.append("text")
            .attr("x", function(d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("dy", ".35em")
            .attr('class', 'nodeText')
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            //.text(function(d) {
            //    return d.name;
            //})
            .style("fill-opacity", 0)
            .on('mouseup', mouseup).select('tspan').remove();

        // phantom node to give us mouseover in a radius around it
        nodeEnter.append("circle")
            .attr('class', 'ghostCircle')
            .attr("r", 30)
            .attr("opacity", 0.2) // change this to zero to hide the target area
            .style("fill", "red")
            .attr('pointer-events', 'mouseover')
            .on("mouseover", function(node) {
                overCircle(node);
            })
            .on("mouseout", function(node) {
                outCircle(node);
            });

        // Update the text to reflect whether node has children or not.
        node.select('text').selectAll('tspan').remove();

        node.select('text')
            .attr("x", function(d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .append(function(d) {
                var text,lineHeight= 5,fontSize=12;
                if(/\n/.test(d.name)){
                    text=[];
                    var lines=d.name.split('\n');
                    var linesTotal=lines.length;
                    var x=d.children || d._children ? -10 : 10;

                    lines.each(function(item,i){
                        var calLineHeight=(i*(lineHeight+fontSize)-(fontSize*linesTotal+lineHeight*(linesTotal-1))/2);

                        if(i==1){
                            text.push('<tspan x="'+x+'" y="'+(calLineHeight+2)+'">'+item+'</tspan>');
                        }else{
                            text.push('<tspan x="'+x+'" y="'+calLineHeight+'">'+item+'</tspan>');
                        }

                    });
                    text=text.join('');
                    //console.log(parseSVG(text));
                }else{
                    text='<tspan>'+d.name+'</tspan>';
                }

                text=parseSVG(text);
                return text;
            });

        // Change the circle fill depending on whether it has children and is collapsed
        node.select("circle.nodeCircle")
            .attr("r", 4.5)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Fade the text in
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 0);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        // Update the links…
        var link = svgGroup.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        //重新计算节点的y坐标
        //nodes.forEach(function(d) { d.y = d.depth * 180; });
    }

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append("g");

    // Define the root
    root = treeData;
    root.x0 = viewerHeight / 2;
    root.y0 = 0;

    // Layout the tree initially and center on the root node.
    update(root);
    centerNode(root);

    //if(centerCount==1){
    //    centerNode(root);
    //}

    centerCount=2;
    d3.select('svg').on('click',function(){
        $('.buttons').hide();
    });
    //$('svg').not($('g')).click(function(){
    //    hideInput();
    //    //return false;
    //});

    //
    //setInterval(function(){
    //    var obj=getOriginData(root);
    //    //console.log(JSON.stringify(obj));
    //    ref.set(obj);
    //},3000);

    //observe(root, function (name, value , old) {
    //    console.log(name + "__" + value + "__" + old);
    //    var obj=getOriginData(root);
    //    //console.log(JSON.stringify(obj));
    //    ref.set(obj);
    //});

});
// Get JSON data
//treeJSON = d3.json("flare.json", function(error, treeData) {
//
//});
function parseSVG(s) {
    var div= document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    div.innerHTML= '<svg xmlns="http://www.w3.org/2000/svg">'+s+'</svg>';
    var frag= document.createDocumentFragment();
    while (div.firstChild.firstChild)
        frag.appendChild(div.firstChild.firstChild);
    return frag;
}

//function makeSVG(tag, attrs) {
//    var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
//    for (var k in attrs)
//        el.setAttribute(k, attrs[k]);
//    return el;
//}
//
//var circle= makeSVG('circle', {cx: 100, cy: 50, r:40, stroke: 'black', 'stroke-width': 2, fill: 'red'});
//document.getElementById('s').appendChild(circle);
//circle.onmousedown= function() {
//    alert('hello');
//};

function deepClone(obj,targetObj){
    //把targetObj引用赋值给obj
    for(var key in obj){
        obj[key]= isObject(targetObj[key]) ? deepClone(obj[key],targetObj[key]):targetObj[key];
        if(isArray(obj[key])){
            obj[key]=[];
            obj[key]=obj[key].concat(targetObj[key]);
        }
    }
    return obj;
}
function isArray(v){
    return toString.apply(v) === '[object Array]';
}
function isObject(v){
    if(typeof v == 'object'){
        if(!isArray(v)){
            return true;
        }
    }
    return false;
}