

    // 自定义全局校验配置信息
    cap.customValidConfig = {showTips: true};
    // 存储数据模型属性所关联的数据项配置信息，如：[{"attrs":["数据模型属性名称"],"code":"数据字典编码|枚举类","type":"数据类型dictionary|enum","projectName":"工程名称"}]
    cap.dicDatas = [];
    // 区分编辑与新增的标识
    pageMode = cap.getUrlArgs("pageMode");
    // id
    id = cap.getUrlArgs("id");
    // 流程
    flowState = cap.getUrlArgs("flowState");
    // 工程停工表
    proStop = {};
    // 工程停工令请求实体
    proStopReq = {};
    // 工程停工令响应实体
    proStopRsp = {};
    // 分包信息
    subcontract = {};
    // 分包信息集合
    subcontractList = cap.getSessionAttribute("subcontractList", []);
    // 停工令列表页面
    stopWorkOrder2List = basePath + '/gmp/static/se/zhgc_progresscontrol/StopWorkOrder2List.html';
    
    /**
	 * 定义页面需要的变量
	 */
	var orgId = ''
	//权限数组
	pageModeArr = ['create', 'edit', 'detail', 'todo'];
	//选标段的回调函数
	window.saveSelectProjectInfo = saveSelectProjectInfo;
	//是否显示SubcontractTable
	showSubcontractTable = false;
	//分包单位信息存储
	subcontractTableData = [];
    
    /**
	 * 返回按钮跳转页面 
	 * 
	 * @param {Object} ui 当前组件实例
	 */
	function backTo(ui) {
	    var backToInner = function() {
	        var pageJumpURL = stopWorkOrder2List;
	        var container = window;
	        window.close();
	        cap.pageJump(pageJumpURL, "location", container);
	    };
	    var dataModelComparer = new cap.DataModelCompare();
	    var ignoreAttributeNames = []; //选择忽略属性
	    var changedFlag = dataModelComparer.addIgnoreAttributes(ignoreAttributeNames).isChanged(true, proStopReqClone, proStopReq); //深度比较为true
	    if (!changedFlag) {
	        backToInner();
	        return;
	    }
	    var options = {
	        title: "提示",
	        content: '确定放弃修改吗？',
	        btns: ['确定', '取消'],
	        callbacks: [function() {
	            this.close();
	            backToInner();
	        },
	        function() {
	            this.close();
	        }],
	        hasCoverLayer: false,
	        btnAlign: 'center'
	    };
	    Popup(options);
	}
    
    /**
	 * 页面初始化之前行为 
	 */
	cap.pageInitBeforeProcess = function() {
	    if (!pageModeArr.includes(pageMode)) {
	        var options = {
	            title: "提示",
	            content: '无权限访问',
	            btns: ['确定'],
	            callbacks: [function() {
	                this.close();
	                window.close();
	            }],
	            hasCoverLayer: true,
	            btnAlign: 'right',
	            clickCoverClose: false,
	            hasCloseBtn: false
	        };
	        Popup(options);
	        return;
	    };
	    //proStopRsp proStopReq
	    //proStopRsp.id = id;
	    //console.log(id);
	    //cap.formId = cap.getPrimaryValue(proStopRsp.id);
	    if (!cap.isUndefinedOrNullOrBlank(id)) {
	        //获取访问url
	        var url = '/engineer-manage/proStop/queryProStopById/' + id;
	        // ajax请求设置
	        var settings = {
	            async: false,
	            dataType: "json"
	        };
	        cap.ajax.get(url, {},
	        settings).success(function(result) {
	            if (result.code != 200) {
	                Popup({
	                    type: 2,
	                    theme: "popup-danger-bg",
	                    content: result.message
	                });
	                return;
	            };
	            if (result == null) {
	                console.log('%c /engineer-manage/proStop/queryProStopById/接口出错', "color:red;font-weight:bold");
	                Popup({
	                    type: 2,
	                    theme: "popup-danger-bg",
	                    content: "接口异常，请检查数据格式。"
	                });
	            };
	            if (!result.data) {
	                Popup({
	                    type: 2,
	                    theme: "popup-danger-bg",
	                    content: "查询无数据"
	                });
	                return;
	            }
	            proStopRsp = result.data;
	            proStopReq = proStopRsp;
	            if (pageMode != "create" && !proStopRsp.isShow) {
	                //处理侧边菜单
	                let tmplen = cap.uiConfig['maodianDiv'].data.length;
	                if (tmplen > 0) {
	                    cap.uiConfig['maodianDiv'].data.splice(tmplen - 1);
	                }
	            }
	            if (result.data.notificeTypeList) {
	                cap.uiConfig['notificeType'].value = result.data.notificeTypeList;
	            }
	        }).error(function(XMLHttpRequest, textStatus, errorThrown) {
	            Popup({
	                type: 2,
	                theme: "popup-danger-bg",
	                content: "数据请求失败。"
	            });
	        });
	    } else {
	        proStopReq.id = cap.Math.uuid();
	        proStopRsp.id = proStopReq.id;
	    }
	    if (pageMode == 'detail' || pageMode == 'todo') {
	        let basicsProjectUrl = '/engineer-manage/pmcProject/queryBasicsProjectInfo/';
	        let basicsProjectData = {
	            engineerId: proStopReq.engineerId,
	            projectId: proStopReq.projectId,
	            bidId: proStopReq.sectionId
	        };
	        // ajax请求设置
	        let Settings = {
	            async: false,
	            dataType: "json"
	        };
	        //请求项目基本信息
	        cap.ajax.post(basicsProjectUrl, basicsProjectData, Settings).success(function(result) {
	            if (result.code == 200) {
	                //测试
	                /*result.data={};
	                result.data.subcontractList=[
	                    {subcontractName:'111',subcontractUserName:'222',subcontractPhone:'333'},
	                    {subcontractName:'444',subcontractUserName:'555',subcontractPhone:'888'}
	                ];*/
	                if (result.data != null) {
	                    if (result.data.subcontractList && result.data.subcontractList.length > 0) {
	                        //判断分包单位长度控制显示
	                        if (result.data.subcontractList.length > 1) {
	                            showSubcontractTable = true;
	                            subcontractTableData = result.data.subcontractList;
	                        } else {
	                            //使用input显示
	                            subcontract.subcontractName = result.data.subcontractList[0].subcontractName;
	                            subcontract.subcontractUserName = result.data.subcontractList[0].subcontractUserName;
	                            subcontract.subcontractPhone = result.data.subcontractList[0].subcontractPhone;
	                        }
	                    }
	                }
	            } else {
	                Popup({
	                    type: 2,
	                    theme: "popup-danger-bg",
	                    content: "接口异常，请检查数据格式。"
	                });
	            }
	        }).error(function(XMLHttpRequest, textStatus, errorThrown) {
	            Popup({
	                type: 2,
	                theme: "popup-danger-bg",
	                content: "数据请求失败。"
	            });
	        });
	    };
	    /*
	    $('#colid-9084825278705668').css('display','none');
	    $('#colid-44294418768512976').css('display','none');
	    $('#formLayoutid-43979583178631465').css('display','none');
	    $('#formLayoutid-7930479238136573').css('display','none');
	    if(parseInt(pageMode) ===2||parseInt(pageMode) ===4||parseInt(pageMode) ===1){
	      if(parseInt(pageMode) ===2){
	          $('title').text('编辑暂停令');//变更网页title
	          $('#uiid-2513114274703336').text('编辑暂停令');
	      }else if(parseInt(pageMode) ===4){
	          $('title').text('工程暂停令审核');//变更网页title
	          $('#uiid-2513114274703336').text('工程暂停令审核');
	      }else if(parseInt(pageMode) ===1){
	          $('title').text('工程暂停令详情');//变更网页title
	          $('#uiid-2513114274703336').text('工程暂停令详情');
	          $('#formLayoutid-43979583178631465').css('display','block');
	         if(isShow){
	             $('#formLayoutid-9347994741988461').css('display','block'); 
	         }
	          $('#colid-9084825278705668').css('display','block');
	          $('#colid-44294418768512976').css('display','block');
	      }
	      $('#formLayoutid-7930479238136573').css('display','block');  
	      var url = '/engineer-manage/proStop/queryProStopById/'+id;
	      // ajax请求设置
	      var settings = {async: false, dataType: "json"};
	      // 调用后台查询
	      cap.ajax.get(url, {}, settings).success(function(result){ 
	        console.log('编辑详情',result);
	        proStopRsp = result.data;
	       }).error(function(XMLHttpRequest, textStatus, errorThrown) {  
	           });
	    }else if(parseInt(pageMode) ===3){
	        $('title').text('签发暂停令');//变更网页title
	        $('#uiid-2513114274703336').text('签发暂停令');
	        proStopRsp.id = getUUID();
	    };*/
	}
    
    /**
	 * 跳出选择地图页面弹出层?? 
	 */
	function openMapPopup(idList) {
	    var opts = {
	        type: 4,
	        content: "",
	        btns: ['确认', '取消'],
	        title: "选择坐标",
	        callbacks: [function() {
	            var iframe = document.getElementsByTagName('iframe')[0];
	            console.log(iframe);
	            var posData = iframe.contentWindow.pointEntity;
	            console.log(posData); //选择到的点实体 posData.feature里包含有中文位置信息（要选的精确）posData.lngLat里包含有
	            this.close(event);
	        },
	        function() {
	            console.log('取消');
	            this.close(event);
	        }],
	        afterClose: function($el, index) {},
	        width: 1115,
	        height: 600
	    };
	    opts.content = "/zhgc_zhgc/choosePosPage.html";
	    window.pagePopupLayer = Popup(opts);
	}
    
    /**
	 * 页面初始化之后行为 
	 */
	cap.pageInitAfterProcess = function() {
	    //控制[ 执行确认信息 ]是否显示
	    if (pageMode != 'create') {
	        if (proStopRsp.isShow) {
	            if (!proStopRsp.isEdit) {
	                //改文本 
	                cap.setUIState('implementation1', "textmode");
	                cap.setUIState('completion1', "textmode");
	                cap.setUIState('actualStopTime1', "textmode");
	            }
	        } else {
	            //隐藏
	            cap.setUIState('formLayoutid-9347994741988461', "hide");
	            cap.setUIState('colid-8461795586116098', "hide");
	            //取消验证
	            cap.disValid('implementation1', true);
	            cap.disValid('completion1', true);
	            cap.disValid('actualStopTime1', true)
	        }
	    }
	    if (pageMode == 'detail' || pageMode == 'todo') {
	        if (showSubcontractTable) {
	            //使用table显示
	            cap.setUIState('subcontractTable', "edit");
	            cap.setUIState('formLayoutid-5459783826455718', "hide");
	            C5('#subcontractTable').setDataSource(subcontractTableData, subcontractTableData.length);
	        }
	    };
	    //控制标题文字
	    if (proStopRsp.processInsId) {
	        $('uiid-2513114274703336').text('工程暂停令审核');
	    } else {
	        switch (pageMode) {
	        case 'create':
	            $('uiid-2513114274703336').text('签发暂停令');
	            $('title').html('签发暂停令');
	            break;
	        case 'edit':
	            $('uiid-2513114274703336').text('编辑暂停令');
	            break;
	        case 'todo':
	            $('uiid-2513114274703336').text('工程暂停令详情');
	            break;
	        case 'detail':
	            $('uiid-2513114274703336').text('工程暂停令详情');
	            break;
	        default:
	            console.log('无法匹配');
	        }
	    }
	}
    
    /**
	 * 初始化下拉框数据 
	 * 
	 * @param {Object} ui 当前组件实例
	 */
	function initDatasource(ui) {
	    var data = [];
	    // 获取访问url
	    var url = '/system-manage/sysDataDict/queryDictByParentCode?parentCode=NOTIFICE_TYPE';
	    // ajax请求设置
	    var settings = {
	        async: false,
	        dataType: "json"
	    };
	    // 调用后台查询
	    cap.ajax.get(url, {},
	    settings).success(function(result) {
	        if (result.code == 200) {
	            //data = result.data;
	            for (let value of result.data) {
	                data.push({
	                    id: value.dicVal,
	                    value: value.dicName
	                });
	            };
	            console.log(data);
	        } else {
	            Popup({
	                type: 2,
	                theme: "popup-danger-bg",
	                content: result.message
	            });
	        }
	    }).error(function(XMLHttpRequest, textStatus, errorThrown) {
	        Popup({
	            type: 2,
	            theme: "popup-danger-bg",
	            content: "数据请求失败。"
	        });
	    });
	    ui.setDataSource(data);
	}
    
    /**
	 * 点击标段的回调 
	 * 
	 * @param {Object} ui 当前组件实例
	 */
	function onFocus(ui) {
	    var currentHeight = 600;
	    var currentWidth = 1200;
	    var opts = {
	        type: 4,
	        content: '',
	        //btns: ['确认', '取消'],
	        title: '选择标段',
	        width: currentWidth,
	        height: currentHeight,
	        /*callbacks: [
	        function() {
	          //点击确认的回调
	          var iframe = document.getElementsByTagName('iframe')[0]; //根据页面中有多少个iframe需要手动修改是第几个
	          var sectionRes = iframe.contentWindow.sectionIdquery();// 标段查询
	          var selTable = iframe.contentWindow.C5('#uiid-14370311887002936').getSelectedRowData();
	          console.log(selTable);
	          if (sectionRes.query) {
	              proStopRsp.projectName = selTable[0].projectName;
	              proStopRsp.projectCode = selTable[0].projectCode;
	              proStopRsp.projectId = selTable[0].projectId;
	              proStopRsp.engineerName = selTable[0].unitProjectName;
	              proStopRsp.engineerCode = selTable[0].unitProjectCode;
	              proStopRsp.engineerId = selTable[0].unitProjectId;
	              proStopRsp.sectionName = sectionRes.sectionName;
	              proStopRsp.sectionId = sectionRes.sectionId;
	              proStopRsp.contractUnitName = sectionRes.constructUnitName;
	              proStopRsp.contractUnitId = sectionRes.constructUnitId;
	             cap.resetDataBind();
	            }
	            $('#formLayoutid-7930479238136573').css('display','block');
	            //selectedPersonnel();
	            selectedPersonnel(C5('#acceptor'));
	            this.close(event);
	        },
	        function() {
	          //点击取消的回调
	          this.close(event);
	        }
	      ],*/
	        afterClose: function($el, index) {
	            //关闭弹窗后的回调
	        }
	    }
	    //opts.content = '/gmp/static/se/zhgc_progresscontrol/gmp_selectProject.html';
	    //opts.content = '/gmp/static/se/bzk/gmp_selectProject_engineer.html';
	    //window.pagePopupLayer = Popup(opts);
	    opts.content = "/gmp/static/se/bzk/selectProject_engineer.html";
	    window.popupSelectProject = Popup(opts);
	}
    
    /** zhangwei
	 * 保存表单行为 
	 */
	function saveForm() {
	    if (cap.validateForm()) {
	        cap.beforeSave();
	        //获取访问url
	        var url = '/engineer-manage/proStop/saveOrUpdate';
	        var data = proStopReq;
	        // ajax请求设置
	        var settings = {
	            async: false,
	            dataType: "json"
	        };
	        // 在接口调用前，可以修改调用的参数
	        //测试
	        proStopRsp.acceptorId = getUUID();
	        proStopRsp.acceptor = 'c';
	        //console.log(proStopRsp.acceptorId, proStopRsp);
	        data = {
	            notificeTypeList: String(proStopRsp.notificeType).split(';'),
	            proStop: proStopRsp
	        };
	        C5("#btn-save").setLoading(true);
	        // 调用后台方法
	        cap.ajax.post(url, data, settings).success(function(result) {
	            isSave = true;
	            C5("#btn-save").setLoading(false);
	            if (result.code !== 200) {
	                Popup({
	                    type: 2,
	                    theme: 'popup-danger-bg',
	                    content: '响应错误:' + result.message
	                });
	                return;
	            };
	            if (cap.isUndefined(result.data) || cap.isNull(result.data) || !cap.isObject(result.data)) {
	                Popup({
	                    type: 2,
	                    theme: 'popup-danger-bg',
	                    content: '响应体data格式错误,data=' + result.data
	                });
	                return;
	            } else {
	                var results = result.data;
	                //响应体不规范可以在这里进行处理
	                proStopRsp = results;
	            };
	            // 成功赋值后，可添加额外的逻辑                                        
	            var pWindow = cap.searchParentWindow('reloadTableForGmpTpl');
	            if (pWindow && 'function' === typeof(pWindow['reloadTableForGmpTpl'])) {
	                pWindow['reloadTableForGmpTpl']();
	            }
	            Popup({
	                type: 2,
	                theme: "popup-success-bg",
	                content: '保存成功。',
	            });
	        }).error(function(XMLHttpRequest, textStatus, errorThrown) {
	            C5("#btn-save").setLoading(false);
	            Popup({
	                type: 2,
	                theme: "popup-danger-bg",
	                content: "保存失败，请稍后重试。"
	            });
	        });
	    }
	}
    
    /**
	 * 用户自定义形参行为???? 
	 */
	function postUp(params) {
	    var url = '/engineer-manage/proStop/reportProcess';
	    var data = {
	        "targetUserId": params.targetUserId,
	        "targetUserName": params.targetUserName,
	        "taskId": params.taskId,
	        "opinion": params.opinion,
	        "backNodeId": null,
	        engineerName: null,
	        notificeTypeList: proStop.notificeType,
	        proStop: {
	            id: stopOrderId,
	            stopCode: proStop.stopCode,
	            projectId: proStop.projectId,
	            projectName: proStop.projectName,
	            projectCode: proStop.projectCode,
	            bidId: proStop.bidId,
	            bidName: proStop.bidName,
	            engineerId: proStop.engineerId,
	            engineerName: proStop.engineerName,
	            stopPart: proStop.stopPart,
	            stopFactor: proStop.stopFactor,
	            rectifyReform: proStop.rectifyReform,
	            notificeType: String(proStop.notificeType),
	            notificeTime: proStop.notificeTime,
	            stopTime: proStop.stopTime,
	            creatorId: null
	        }
	    };
	    cap.ajax.post(url, data, {
	        async: false,
	        dataType: "json"
	    }).success(function(result) {
	        console.log(result, '保存');
	        Popup({
	            type: 2,
	            theme: "popup-success-bg",
	            content: '上报成功。',
	            afterClose: function($el, index) {
	                cap.pageJump("/gmp/static/se/zhgc_progresscontrol/StopWorkOrder2List.html", "", window);
	                popNum++;
	            }
	        });
	    }).error(function(XMLHttpRequest, textStatus, errorThrown) {
	        Popup({
	            type: 2,
	            theme: "popup-danger-bg",
	            content: "上报失败，请稍后重试。",
	            afterClose: function() {
	                popNum++;
	            }
	        });
	    });
	}
    
    /**
	 * 用户自定义形参行为(删) 
	 */
	function getUUID() {
	    var s = [];
	    var hexDigits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	    for (var i = 0; i < 36; i++) {
	        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	    };
	    s[14] = "4";
	    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
	    s[8] = s[13] = s[18] = s[23] = "-";
	    let uuid = s.join("");
	    uuid = uuid.replace(/-/g, ''); //去掉横杆线
	    return uuid;
	}
    
    /**
	 * 选择接受人的回调？？ 
	 * 
	 * @param {Object} ui 当前组件实例
	 */
	function selectPersonnel(ui) {
	    var currentHeight = 600;
	    var currentWidth = 1200;
	    var opts = {
	        type: 4,
	        content: '',
	        btns: ['确认', '取消'],
	        title: '选择接受人',
	        width: currentWidth,
	        height: currentHeight,
	        callbacks: [function() {
	            //点击确认的回调
	            var iframe = document.getElementsByTagName('iframe')[0]; //根据页面中有多少个iframe需要手动修改是第几个
	            var selTable = iframe.contentWindow.C5('#uiid-14370311887002936').getSelectedRowData();
	            console.log(selTable);
	            if (selTable.length > 0) {
	                proStop.acceptorId = selTable[0].projectName;
	                proStop.acceptor = selTable[0].unitId;
	                cap.resetDataBind();
	            }
	            //onChange();
	            this.close(event);
	        },
	        function() {
	            //点击取消的回调
	            this.close(event);
	        }],
	        afterClose: function($el, index) {
	            //关闭弹窗后的回调
	        }
	    }
	    opts.content = '/gmp/static/se/zhgc_progresscontrol/choosePersonBySectionShutDown.html' + '?unitId=' + proStop.contractUnitId;
	    window.pagePopupLayer = Popup(opts);
	}
    
    /**
	 * 选项改变的回调?? 
	 * 
	 * @param {Object} ui 当前组件实例
	 * @param {Object|Array} selectedData 选中项数据
	 */
	function onChange(ui, selectedData) {
	    if (proStop.contractUnitId) {
	        // 获取访问url
	        var url = '/system-manage/jadpWorkBench/queryUserByConditionByPage';
	        // ajax请求设置
	        var settings = {
	            async: false,
	            dataType: "json"
	        };
	        // 调用后台查询
	        cap.ajax.post(url, {
	            orgId: proStop.contractUnitId
	        },
	        settings).success(function(result) {
	            data = result.data;
	        }).error(function(XMLHttpRequest, textStatus, errorThrown) {});
	        C5("#curUserName").setDataSource(data);
	    }
	    /*if(selectedData){
	            var data = [];
	            switch(selectedData.dicVal){
	                case "01":
	                    data.push({id:"02",dicVal:"02",dicName:"勘察设计合同"},{id:"03",dicVal:"03",dicName:"工程施工合同"},{id:"04",dicVal:"04",dicName:"工程监理合同"});
	                    break;
	                default:
	                    break;
	            }
	           C5("#contType2Code").setDataSource(data);
	        }*/
	}
    
    /**
	 * 流程上报行为(修改)
	 */
	function workFlowEntry() {
	    var getData = function() {
	        var entryData = [];
	        cap.beforeSave();
	        entryData[0] = proStopRsp;
	        return entryData;
	    };
	    var flowOperateCallback = function(result) {
	        if (1 == result['successes']) {
	            var options = {
	                type: 2,
	                content: '操作成功。',
	                theme: "popup-success-bg",
	                time: 3000,
	                afterOpen: function($el, index) {
	                    var url = '/engineer-manage/proStop/approvalCallback?id=' + id;
	                    // ajax请求设置
	                    var settings = {
	                        async: false,
	                        dataType: "json"
	                    };
	                    // 调用后台查询
	                    cap.ajax.post(url, {},
	                    settings).success(function(result) {
	                        //console.log('接口',result);
	                        backTo();
	                    }).error(function(XMLHttpRequest, textStatus, errorThrown) {});
	                    //backTo();  
	                }
	            };
	            Popup(options);
	        }
	        if (1 == result['errors']) {
	            var options = {
	                title: '提示',
	                content: '操作失败。 <br>详细信息：' + result.message,
	                btns: '确定',
	                afterClose: function() {}
	            };
	            Popup(options);
	        }
	        // 如果为新窗口方式打开，则取父窗口
	        var _window = window.opener ? window.opener: window;
	        // 刷新顶层消息数
	        typeof _window.top.getMessageAndTodoCount === 'function' && _window.top.getMessageAndTodoCount();
	        // 获取流程实例id
	        var processId = result["waitingNodeInfo"] ? result["waitingNodeInfo"][0].processId: '';
	        // 刷新顶层待办数
	        typeof _window.top.refreshTodoCount === 'function' && _window.top.refreshTodoCount(processId);
	    };
	    var options = {
	        content: "请完善表单"
	    };
	    saveForm();
	    if (cap.validateForm(options)) {
	        bpms.rt10.workflow.config.subSystemRoot = "/engineer-manage";
	        bpms.rt10.workflow.config.workflowFacadeName = "proStopFacade";
	        bpms.rt10.workflow.operate.report(false, getData, flowOperateCallback);
	    }
	}
    
    /**
	 * 编辑页面查看流程跟踪
	 */
	function viewTrackEdit() {
	    var selectData = proStopRsp;
	    var options = {};
	    if (null == selectData) {
	        options.type = 2;
	        options.theme = "popup-danger-bg";
	        options.content = "请选择数据。";
	        Popup(options);
	        return;
	    }
	    var _processId = selectData.processId || "proStop";
	    if (!_processId) {
	        options.title = "提示";
	        options.btns = "确定";
	        options.content = "流程编号为空，无法查看流程跟踪。";
	        Popup(options);
	        return;
	    }
	    bpms.rt10.workflow.config.subSystemRoot = "/engineer-manage";
	    bpms.rt10.workflow.config.workflowFacadeName = "proStopFacade";
	    bpms.rt10.workflow.operate.flowTrack(_processId, selectData.processInsId);
	}
    
    /**
	 * 编辑页面流程审批行为??
	 */
	function audit() {
	    var getData = function() {
	        var entryData = [];
	        cap.beforeSave();
	        entryData[0] = proStopRsp;
	        return entryData;
	    };
	    var flowOperateCallback = function(result) {
	        if (1 == result['successes']) {
	            var options = {
	                type: 2,
	                content: '操作成功。',
	                theme: "popup-success-bg",
	                time: 3000,
	                afterOpen: function($el, index) {
	                    var url = '/engineer-manage/proStop/approvalCallback?id=' + id;
	                    var settings = {
	                        async: false,
	                        dataType: "json"
	                    };
	                    // 调用后台查询
	                    cap.ajax.post(url, {},
	                    settings).success(function(result) {
	                        //console.log('接口',result);                      
	                        backTo();
	                    }).error(function(XMLHttpRequest, textStatus, errorThrown) {});
	                    //window.location.href = '/gmp/static/se/zhgc_progresscontrol/StopWorkOrderToDoList.html';
	                }
	            };
	            Popup(options);
	        }
	        if (1 == result['errors']) {
	            var options = {
	                title: '提示',
	                content: '操作失败。 <br>详细信息：' + result.message,
	                btns: '确定',
	                afterClose: function() {}
	            };
	            Popup(options);
	        }
	        // 如果为新窗口方式打开，则取父窗口
	        var _window = window.opener ? window.opener: window;
	        // 刷新顶层消息数
	        typeof _window.top.getMessageAndTodoCount === 'function' && _window.top.getMessageAndTodoCount();
	        // 获取流程实例id
	        var processId = result["waitingNodeInfo"] ? result["waitingNodeInfo"][0].processId: '';
	        // 刷新顶层待办数
	        typeof _window.top.refreshTodoCount === 'function' && _window.top.refreshTodoCount(processId);
	    };
	    var options = {
	        content: "审批失败，请重新再试"
	    };
	    if (cap.validateForm(options)) {
	        bpms.rt10.workflow.config.subSystemRoot = "/engineer-manage";
	        bpms.rt10.workflow.config.workflowFacadeName = "proStopFacade";
	        bpms.rt10.workflow.operate.send(false, getData, flowOperateCallback);
	    }
	}
    
    /**
	 * 编辑页面流程回退行为
	 */
	function backEditData() {
	    var getData = function() {
	        var entryData = [];
	        cap.beforeSave();
	        entryData[0] = proStopRsp;
	        return entryData;
	    };
	    var flowOperateCallback = function(result) {
	        if (1 == result['successes']) {
	            var options = {
	                type: 2,
	                content: '操作成功。',
	                theme: "popup-success-bg",
	                time: 3000,
	                afterOpen: function($el, index) {
	                    backTo();
	                    /*var url = '/engineer-manage/proStop/approvalCallback?id='+id;
	                    var settings = {async: false, dataType: "json"};
	                    // 调用后台查询
	                    cap.ajax.post(url, {}, settings).success(function(result){ 
	                    //console.log('接口',result);                      
	                        backTo(); 
	                   }).error(function(XMLHttpRequest, textStatus, errorThrown) {  
	                       }); */
	                }
	            };
	            C5("#btn-back-edit").setLoading(false);
	            Popup(options);
	        }
	        if (1 == result['errors']) {
	            var options = {
	                title: '提示',
	                content: '操作失败。 <br>详细信息：' + result.message,
	                btns: '确定',
	                afterClose: function() {}
	            };
	            C5("#btn-back-edit").setLoading(false);
	            Popup(options);
	        }
	        // 如果为新窗口方式打开，则取父窗口
	        var _window = window.opener ? window.opener: window;
	        // 刷新顶层消息数
	        typeof _window.top.getMessageAndTodoCount === 'function' && _window.top.getMessageAndTodoCount();
	        // 获取流程实例id
	        var processId = result["waitingNodeInfo"] ? result["waitingNodeInfo"][0].processId: '';
	        // 刷新顶层待办数
	        typeof _window.top.refreshTodoCount === 'function' && _window.top.refreshTodoCount(processId);
	    };
	    if (cap.validateForm()) {
	        bpms.rt10.workflow.config.subSystemRoot = "/engineer-manage";
	        C5("#btn-back-edit").setLoading(true);
	        bpms.rt10.workflow.config.workflowFacadeName = "proStopFacade";
	        bpms.rt10.workflow.operate.back(false, getData, flowOperateCallback);
	    }
	}
    
    /**
	 * 按钮点击事件 
	 * 
	 * @param {Object} ui 当前组件实例
	 */
	function onClick(ui) {
	    var url = '/engineer-manage/proStop/exportDoc?id=' + id;
	    // ajax请求设置
	    var settings = {
	        async: false,
	        dataType: "json"
	    };
	    // 调用后台查询
	    cap.ajax.post(url, {},
	    settings).success(function(result) {
	        console.log('预览', result);
	        //proStop = result.data;
	        //proStop.notificeType = result.data.notificeTypeList;
	    }).error(function(XMLHttpRequest, textStatus, errorThrown) {});
	    //document.getElementById('uiid-5818410204203266').contentWindow.readOnline(value.row.planAttachId, 'xlsx','17300', 'read');
	}
    
    /**
	 * 初始化下拉框数据 
	 * 
	 * @param {Object} ui 当前组件实例
	 */
	function selectedPersonnel(ui) {
	    var data = [];
	    //console.log(proStopRsp.contractUnitId);
	    console.log('yooo');
	    if (proStopRsp.contractUnitId) {
	        // 获取访问url
	        var url = '/system-manage/jadpWorkBench/queryUserByConditionByPage';
	        // ajax请求设置
	        var settings = {
	            async: false,
	            dataType: "json"
	        };
	        // 调用后台查询
	        cap.ajax.post(url, {
	            orgId: proStopRsp.contractUnitId
	        },
	        settings).success(function(result) {
	            console.log(result);
	            data = result.data;
	            //返回无数据，外部接口
	            //填充数据
	            if (result.code == 200) {
	                console.log('yooo');
	                data = [{
	                    id: '1',
	                    value: '选项1'
	                },
	                {
	                    id: '2',
	                    value: '选项2'
	                },
	                {
	                    id: '3',
	                    value: '选项3'
	                }];
	            } else {
	                Popup({
	                    type: 2,
	                    theme: "popup-danger-bg",
	                    content: result.message
	                });
	            }
	        }).error(function(XMLHttpRequest, textStatus, errorThrown) {
	            Popup({
	                type: 2,
	                theme: "popup-danger-bg",
	                content: "数据请求失败。"
	            });
	        });
	        console.log(ui, C5("#acceptor"));
	        //ui.setDataSource(data1);
	    }
	    ui.setDataSource(data);
	}
    
    /**
	 * 用户自定义形参行为 
	 */
	function saveSelectProjectInfo(data) {
	    proStopRsp.projectName = data.projectName;
	    proStopRsp.projectCode = data.projectCode;
	    proStopRsp.projectId = data.projectId;
	    proStopRsp.engineerName = data.unitProjectName;
	    proStopRsp.engineerCode = data.unitProjectCode;
	    proStopRsp.engineerId = data.unitProjectId;
	    proStopRsp.sectionName = data.sectionName;
	    proStopRsp.sectionId = data.sectionId;
	    let url = 'engineer-manage/proUnitBidNotice/queryProUnitListByCondition';
	    let ajaxdata = {
	        engineerId: data.engineerId,
	        projectId: data.projectId,
	        sectionId: data.sectionId,
	        unitType: 2
	    };
	    let settings = {
	        async: false,
	        dataType: "json"
	    };
	    cap.ajax.post(url, ajaxdata, settings).success(function(result) {
	        if (result.code == 200) {
	            console.log(result);
	            if (result.data && result.data.length >= 1) {
	                proStopRsp.contractUnitName = result.data[0].unitName;
	                proStopRsp.contractUnitId = result.data[0].unitId;
	                selectedPersonnel(C5('#acceptor'));
	                console.log(result.data[0].unitName);
	            } else {
	                console.log('%c engineer-manage/proUnitBidNotice/queryProUnitListByCondition不符合预期', "color:red;font-weight:bold");
	            }
	        } else {
	            Popup({
	                type: 2,
	                theme: "popup-danger-bg",
	                content: result.message
	            });
	        }
	    }).error(function(XMLHttpRequest, textStatus, errorThrown) {
	        Popup({
	            type: 2,
	            theme: "popup-danger-bg",
	            content: "数据请求失败。"
	        });
	    });
	    cap.resetDataBind();
	}
    
    /**
	 * 编辑页面流程发送行为
	 */
	function sendEditData() {
	    var getData = function() {
	        var entryData = [];
	        cap.beforeSave();
	        entryData[0] = proStopRsp;
	        //proStop.primaryValue =  proStop.id;
	        return entryData;
	    };
	    var flowOperateCallback = function(result) {
	        if (1 == result['successes']) {
	            var options = {
	                type: 2,
	                content: '操作成功。',
	                theme: "popup-success-bg",
	                time: 3000,
	                afterOpen: function($el, index) {
	                    backTo();
	                }
	            };
	            C5("#btn-send-edit").setLoading(false);
	            Popup(options);
	        }
	        if (1 == result['errors']) {
	            var options = {
	                title: '提示',
	                content: '操作失败。 <br>详细信息：' + result.message,
	                btns: '确定',
	                afterClose: function() {}
	            };
	            Popup(options);
	        }
	        // 如果为新窗口方式打开，则取父窗口
	        var _window = window.opener ? window.opener: window;
	        // 刷新顶层消息数
	        typeof _window.top.getMessageAndTodoCount === 'function' && _window.top.getMessageAndTodoCount();
	        // 获取流程实例id
	        var processId = result["waitingNodeInfo"] ? result["waitingNodeInfo"][0].processId: '';
	        // 刷新顶层待办数
	        typeof _window.top.refreshTodoCount === 'function' && _window.top.refreshTodoCount(processId);
	    };
	    if (cap.validateForm()) {
	        bpms.rt10.workflow.config.subSystemRoot = "/engineer-manage";
	        C5("#btn-send-edit").setLoading(true);
	        bpms.rt10.workflow.operate.send(false, getData, flowOperateCallback);
	    }
	}
    
    /**
	 * 页面初始化完成克隆数据集 
	 */
	cap.cloneObject = function() {
	    window["proStopReqClone"] = {};
	    $.extend ? $.extend(true, window["proStopReqClone"], proStopReq) : window["proStopReqClone"] = JSON.parse(JSON.stringify(proStopReq));
	    window["proStopRspClone"] = {};
	    $.extend ? $.extend(true, window["proStopRspClone"], proStopRsp) : window["proStopRspClone"] = JSON.parse(JSON.stringify(proStopRsp));
	}
    
    /**
	 * 保存并上报行为 
	 */
	function saveAndEntrytAudit() {
	    if (cap.validateForm()) {
	        cap.beforeSave();
	        // ajax请求设置
	        var settings = {
	            async: false,
	            dataType: "text"
	        };
	        //调用后台查询
	        cap.ajax.post('/engineer-manage/proStop/saveOrUpdate', {
	            notificeTypeList: String(proStopRsp.notificeType).split(';'),
	            proStop: proStopRsp
	        },
	        settings).success(function(result) {
	            result = JSON.parse(result);
	            //获取访问url
	            var reloadUrl = '/engineer-manage/proStop/queryProStopById/' + cap.formId,
	            reloadData = '';
	            var settings4Reload = {
	                async: false,
	                dataType: "json"
	            };
	            reloadUrl = '/engineer-manage/proStop/queryProStopById/' + (proStopReq.id ? proStopReq.id: proStopRsp.id);
	            proStopRsp = result.data;
	            //proStopRsp = cap.formId = result
	            //reloadUrl = '/engineer-manage/proStop/queryProStopById/'+ cap.formId
	            //此处为重新读取实体方法，返回对象必须是当前实体对象
	            cap.ajax.get(reloadUrl, reloadData, settings4Reload).success(function(result) {
	                //result = JSON.parse(result);
	                proStopReq = result.data;
	                console.log(result);
	            }).error(function(XMLHttpRequest, textStatus, errorThrown) {});
	            var getData = function() {
	                var entryData = [];
	                entryData[0] = proStopReq;
	                return entryData;
	            };
	            var flowOperateCallback = function() {
	                var options = {
	                    type: 2,
	                    content: "操作成功。",
	                    theme: "popup-success-bg",
	                    afterClose: function() {
	                        saveAndEntrytAudit_CB();
	                    },
	                    time: 3000 // 3s后关闭
	                };
	                Popup(options);
	            };
	            bpms.rt10.workflow.config.subSystemRoot = "/engineer-manage";
	            bpms.rt10.workflow.config.workflowFacadeName = "proStopFacade";
	            bpms.rt10.workflow.operate.report(false, getData, flowOperateCallback);
	        }).error(function(XMLHttpRequest, textStatus, errorThrown) {
	            var options = {
	                title: '提示',
	                content: "保存并上报失败，请稍后重试。",
	                afterClose: function() {},
	                btns: '确定'
	            };
	            Popup(options);
	        });
	    }
	}
    
    /**
	 * 保存并上报的回调接口函数 
	 */
	function saveAndEntrytAudit_CB() {
	    //获取访问url
	    var url = 'engineer-manage/proStop/approvalCallback?id=' + proStopReq.id;
	    var data = '';
	    // ajax请求设置
	    var settings = {
	        async: false,
	        dataType: "json"
	    };
	    cap.ajax.post(url, data, settings).success(function(result) {
	        if (result.code == 200) {
	            window.close();
	        } else {
	            Popup({
	                type: 2,
	                theme: "popup-danger-bg",
	                content: result.message
	            });
	        }
	    }).error(function(XMLHttpRequest, textStatus, errorThrown) {
	        Popup({
	            type: 2,
	            theme: "popup-danger-bg",
	            content: "数据请求失败。"
	        });
	    });
	}
    
    /**
	 * 获取字典值(zhgc) 
	 * dicName: "220V": dicVal: "1"
	 *  页面初始化的时候就调用的话，设置请求为异步
	 */
	function zhgcReqDict(ui) {
	    var data = [];
	    var url = '/system-manage/sysDataDict/queryDictByParentCode?parentCode=NOTIFICE_TYPE';
	    var setting = {
	        async: true,
	        dataType: "json"
	    };
	    cap.ajax.get(url, {},
	    setting).success(function(result) {
	        if (result.code !== 200) {
	            console.error("字典查询失败,parentCode=NOTIFICE_TYPE" + ",message=" + result.message);
	        } else if (cap.isUndefined(result.data) || cap.isNull(result.data) || !cap.isArray(result.data)) {
	            console.error("字典查询响应的格式错误,parentCode=NOTIFICE_TYPE" + ",data=" + result.data);
	        } else if (result.data.length == 0) {
	            console.error("字典parentCode=NOTIFICE_TYPE查询的结果集为空");
	        } else {
	            data = result.data;
	            ui.setDataSource(data);
	        };
	    }).error(function(XMLHttpRequest, textStatus, errorThrown) {
	        console.error("字典查询接口错误,parentCode=NOTIFICE_TYPE");
	    });
	}
    
    //页面初始化状态
    cap.pageInitState = function(){
        if(pageMode=='create'){
            cap.setUIState('btn-save', "edit");
            cap.disValid('btn-save', false);
            cap.setUIState('uiid-5818410204203266', "edit");
            cap.disValid('uiid-5818410204203266', false);
            cap.setUIState('btn-view-track', "hide");
            cap.disValid('btn-view-track', true);
            cap.setUIState('btn-send-edit', "hide");
            cap.disValid('btn-send-edit', true);
            cap.setUIState('btn-back-edit', "hide");
            cap.disValid('btn-back-edit', true);
            cap.setUIState('btn-save-and-entry', "edit");
            cap.disValid('btn-save-and-entry', false);
            cap.setUIState('uiid-16928987589683256', "edit");
            cap.disValid('uiid-16928987589683256', false);
            cap.setUIState('uiid-8706129490738827', "hide");
            cap.disValid('uiid-8706129490738827', true);
            cap.setUIState('projectName1', "hide");
            cap.disValid('projectName1', true);
            cap.setUIState('uiid-8483321942598772', "hide");
            cap.disValid('uiid-8483321942598772', true);
            cap.setUIState('projectCode1', "hide");
            cap.disValid('projectCode1', true);
            cap.setUIState('uiid-59363636936275185', "hide");
            cap.disValid('uiid-59363636936275185', true);
            cap.setUIState('engineerName1', "hide");
            cap.disValid('engineerName1', true);
            cap.setUIState('uiid-4207865224787513', "hide");
            cap.disValid('uiid-4207865224787513', true);
            cap.setUIState('engineerCode1', "hide");
            cap.disValid('engineerCode1', true);
            cap.setUIState('uiid-27031893041088843', "edit");
            cap.disValid('uiid-27031893041088843', false);
            cap.setUIState('sectionName1', "edit");
            cap.disValid('sectionName1', false);
            cap.setUIState('uiid-56354278314021805', "hide");
            cap.disValid('uiid-56354278314021805', true);
            cap.setUIState('voltageGradeStr', "hide");
            cap.disValid('voltageGradeStr', true);
            cap.setUIState('uiid-3735951587508117', "hide");
            cap.disValid('uiid-3735951587508117', true);
            cap.setUIState('projectTypeName', "hide");
            cap.disValid('projectTypeName', true);
            cap.setUIState('uiid-8636564825772874', "hide");
            cap.disValid('uiid-8636564825772874', true);
            cap.setUIState('nature', "hide");
            cap.disValid('nature', true);
            cap.setUIState('uiid-11656121789592568', "hide");
            cap.disValid('uiid-11656121789592568', true);
            cap.setUIState('consDept', "hide");
            cap.disValid('consDept', true);
            cap.setUIState('uiid-3263645827699762', "hide");
            cap.disValid('uiid-3263645827699762', true);
            cap.setUIState('departmentName', "hide");
            cap.disValid('departmentName', true);
            cap.setUIState('uiid-42703755920931904', "hide");
            cap.disValid('uiid-42703755920931904', true);
            cap.setUIState('projectCharger', "hide");
            cap.disValid('projectCharger', true);
            cap.setUIState('uiid-12004694252090236', "hide");
            cap.disValid('uiid-12004694252090236', true);
            cap.setUIState('projectManagerPhone', "hide");
            cap.disValid('projectManagerPhone', true);
            cap.setUIState('uiid-57937326935217754', "hide");
            cap.disValid('uiid-57937326935217754', true);
            cap.setUIState('supervisionName', "hide");
            cap.disValid('supervisionName', true);
            cap.setUIState('uiid-4593560993693706', "hide");
            cap.disValid('uiid-4593560993693706', true);
            cap.setUIState('supervisionDepartment', "hide");
            cap.disValid('supervisionDepartment', true);
            cap.setUIState('uiid-2716559415709033', "hide");
            cap.disValid('uiid-2716559415709033', true);
            cap.setUIState('supervisionUserName', "hide");
            cap.disValid('supervisionUserName', true);
            cap.setUIState('uiid-20718029637330623', "hide");
            cap.disValid('uiid-20718029637330623', true);
            cap.setUIState('supervisionPhone', "hide");
            cap.disValid('supervisionPhone', true);
            cap.setUIState('uiid-6489895604216946', "hide");
            cap.disValid('uiid-6489895604216946', true);
            cap.setUIState('constructionName', "hide");
            cap.disValid('constructionName', true);
            cap.setUIState('uiid-3963698248312586', "hide");
            cap.disValid('uiid-3963698248312586', true);
            cap.setUIState('whetherGeneralContract', "hide");
            cap.disValid('whetherGeneralContract', true);
            cap.setUIState('uiid-4006580662335257', "hide");
            cap.disValid('uiid-4006580662335257', true);
            cap.setUIState('constructionDepartment', "hide");
            cap.disValid('constructionDepartment', true);
            cap.setUIState('uiid-2069302618590677', "hide");
            cap.disValid('uiid-2069302618590677', true);
            cap.setUIState('whetherToSubcontract', "hide");
            cap.disValid('whetherToSubcontract', true);
            cap.setUIState('uiid-7233241223191135', "hide");
            cap.disValid('uiid-7233241223191135', true);
            cap.setUIState('constructionUserName', "hide");
            cap.disValid('constructionUserName', true);
            cap.setUIState('uiid-1352986506246358', "hide");
            cap.disValid('uiid-1352986506246358', true);
            cap.setUIState('constructionPhone', "hide");
            cap.disValid('constructionPhone', true);
            cap.setUIState('uiid-6723547501066508', "hide");
            cap.disValid('uiid-6723547501066508', true);
            cap.setUIState('subcontractName', "hide");
            cap.disValid('subcontractName', true);
            cap.setUIState('uiid-5756069378666568', "hide");
            cap.disValid('uiid-5756069378666568', true);
            cap.setUIState('subcontractUserName', "hide");
            cap.disValid('subcontractUserName', true);
            cap.setUIState('uiid-52520857034014895', "hide");
            cap.disValid('uiid-52520857034014895', true);
            cap.setUIState('subcontractPhone', "hide");
            cap.disValid('subcontractPhone', true);
            cap.setUIState('subcontractTable', "hide");
            cap.disValid('subcontractTable', true);
            cap.setUIState('uiid-3225002844347601', "edit");
            cap.disValid('uiid-3225002844347601', false);
            cap.setUIState('contractUnitName', "disabled");
            cap.disValid('contractUnitName', true);
            cap.setUIState('uiid-7517809052686995', "edit");
            cap.disValid('uiid-7517809052686995', false);
            cap.setUIState('stopScope1', "edit");
            cap.disValid('stopScope1', false);
            cap.setUIState('uiid-9020901305186854', "edit");
            cap.disValid('uiid-9020901305186854', false);
            cap.setUIState('stopTime', "edit");
            cap.disValid('stopTime', false);
            cap.setUIState('uiid-61896546028838294', "edit");
            cap.disValid('uiid-61896546028838294', false);
            cap.setUIState('stopFactor', "edit");
            cap.disValid('stopFactor', false);
            cap.setUIState('uiid-7858354842460729', "edit");
            cap.disValid('uiid-7858354842460729', false);
            cap.setUIState('reformRequire', "edit");
            cap.disValid('reformRequire', false);
            cap.setUIState('uiid-878512144423062', "edit");
            cap.disValid('uiid-878512144423062', false);
            cap.setUIState('notificeType', "edit");
            cap.disValid('notificeType', false);
            cap.setUIState('uiid-9891167705217036', "edit");
            cap.disValid('uiid-9891167705217036', false);
            cap.setUIState('notificeTime', "edit");
            cap.disValid('notificeTime', false);
            cap.setUIState('uiid-9691821450037213', "edit");
            cap.disValid('uiid-9691821450037213', false);
            cap.setUIState('acceptor', "edit");
            cap.disValid('acceptor', false);
            cap.setUIState('uiid-27956094455812778', "edit");
            cap.disValid('uiid-27956094455812778', false);
            cap.setUIState('implementation1', "edit");
            cap.disValid('implementation1', false);
            cap.setUIState('uiid-7222751177204276', "edit");
            cap.disValid('uiid-7222751177204276', false);
            cap.setUIState('completion1', "edit");
            cap.disValid('completion1', false);
            cap.setUIState('uiid-3911445665005044', "edit");
            cap.disValid('uiid-3911445665005044', false);
            cap.setUIState('actualStopTime1', "edit");
            cap.disValid('actualStopTime1', false);
        }
        if(pageMode=='edit'){
            cap.setUIState('btn-save', "edit");
            cap.disValid('btn-save', false);
            cap.setUIState('uiid-5818410204203266', "edit");
            cap.disValid('uiid-5818410204203266', false);
            cap.setUIState('btn-view-track', "hide");
            cap.disValid('btn-view-track', true);
            cap.setUIState('btn-send-edit', "hide");
            cap.disValid('btn-send-edit', true);
            cap.setUIState('btn-back-edit', "hide");
            cap.disValid('btn-back-edit', true);
            cap.setUIState('btn-save-and-entry', "edit");
            cap.disValid('btn-save-and-entry', false);
            cap.setUIState('uiid-16928987589683256', "edit");
            cap.disValid('uiid-16928987589683256', false);
            cap.setUIState('uiid-8706129490738827', "edit");
            cap.disValid('uiid-8706129490738827', false);
            cap.setUIState('projectName1', "disabled");
            cap.disValid('projectName1', true);
            cap.setUIState('uiid-8483321942598772', "edit");
            cap.disValid('uiid-8483321942598772', false);
            cap.setUIState('projectCode1', "disabled");
            cap.disValid('projectCode1', true);
            cap.setUIState('uiid-59363636936275185', "edit");
            cap.disValid('uiid-59363636936275185', false);
            cap.setUIState('engineerName1', "disabled");
            cap.disValid('engineerName1', true);
            cap.setUIState('uiid-4207865224787513', "edit");
            cap.disValid('uiid-4207865224787513', false);
            cap.setUIState('engineerCode1', "disabled");
            cap.disValid('engineerCode1', true);
            cap.setUIState('uiid-27031893041088843', "edit");
            cap.disValid('uiid-27031893041088843', false);
            cap.setUIState('sectionName1', "edit");
            cap.disValid('sectionName1', false);
            cap.setUIState('uiid-56354278314021805', "hide");
            cap.disValid('uiid-56354278314021805', true);
            cap.setUIState('voltageGradeStr', "hide");
            cap.disValid('voltageGradeStr', true);
            cap.setUIState('uiid-3735951587508117', "hide");
            cap.disValid('uiid-3735951587508117', true);
            cap.setUIState('projectTypeName', "hide");
            cap.disValid('projectTypeName', true);
            cap.setUIState('uiid-8636564825772874', "hide");
            cap.disValid('uiid-8636564825772874', true);
            cap.setUIState('nature', "hide");
            cap.disValid('nature', true);
            cap.setUIState('uiid-11656121789592568', "hide");
            cap.disValid('uiid-11656121789592568', true);
            cap.setUIState('consDept', "hide");
            cap.disValid('consDept', true);
            cap.setUIState('uiid-3263645827699762', "hide");
            cap.disValid('uiid-3263645827699762', true);
            cap.setUIState('departmentName', "hide");
            cap.disValid('departmentName', true);
            cap.setUIState('uiid-42703755920931904', "hide");
            cap.disValid('uiid-42703755920931904', true);
            cap.setUIState('projectCharger', "hide");
            cap.disValid('projectCharger', true);
            cap.setUIState('uiid-12004694252090236', "hide");
            cap.disValid('uiid-12004694252090236', true);
            cap.setUIState('projectManagerPhone', "hide");
            cap.disValid('projectManagerPhone', true);
            cap.setUIState('uiid-57937326935217754', "hide");
            cap.disValid('uiid-57937326935217754', true);
            cap.setUIState('supervisionName', "hide");
            cap.disValid('supervisionName', true);
            cap.setUIState('uiid-4593560993693706', "hide");
            cap.disValid('uiid-4593560993693706', true);
            cap.setUIState('supervisionDepartment', "hide");
            cap.disValid('supervisionDepartment', true);
            cap.setUIState('uiid-2716559415709033', "hide");
            cap.disValid('uiid-2716559415709033', true);
            cap.setUIState('supervisionUserName', "hide");
            cap.disValid('supervisionUserName', true);
            cap.setUIState('uiid-20718029637330623', "hide");
            cap.disValid('uiid-20718029637330623', true);
            cap.setUIState('supervisionPhone', "hide");
            cap.disValid('supervisionPhone', true);
            cap.setUIState('uiid-6489895604216946', "hide");
            cap.disValid('uiid-6489895604216946', true);
            cap.setUIState('constructionName', "hide");
            cap.disValid('constructionName', true);
            cap.setUIState('uiid-3963698248312586', "hide");
            cap.disValid('uiid-3963698248312586', true);
            cap.setUIState('whetherGeneralContract', "hide");
            cap.disValid('whetherGeneralContract', true);
            cap.setUIState('uiid-4006580662335257', "hide");
            cap.disValid('uiid-4006580662335257', true);
            cap.setUIState('constructionDepartment', "hide");
            cap.disValid('constructionDepartment', true);
            cap.setUIState('uiid-2069302618590677', "hide");
            cap.disValid('uiid-2069302618590677', true);
            cap.setUIState('whetherToSubcontract', "hide");
            cap.disValid('whetherToSubcontract', true);
            cap.setUIState('uiid-7233241223191135', "hide");
            cap.disValid('uiid-7233241223191135', true);
            cap.setUIState('constructionUserName', "hide");
            cap.disValid('constructionUserName', true);
            cap.setUIState('uiid-1352986506246358', "hide");
            cap.disValid('uiid-1352986506246358', true);
            cap.setUIState('constructionPhone', "hide");
            cap.disValid('constructionPhone', true);
            cap.setUIState('uiid-6723547501066508', "hide");
            cap.disValid('uiid-6723547501066508', true);
            cap.setUIState('subcontractName', "hide");
            cap.disValid('subcontractName', true);
            cap.setUIState('uiid-5756069378666568', "hide");
            cap.disValid('uiid-5756069378666568', true);
            cap.setUIState('subcontractUserName', "hide");
            cap.disValid('subcontractUserName', true);
            cap.setUIState('uiid-52520857034014895', "hide");
            cap.disValid('uiid-52520857034014895', true);
            cap.setUIState('subcontractPhone', "hide");
            cap.disValid('subcontractPhone', true);
            cap.setUIState('subcontractTable', "hide");
            cap.disValid('subcontractTable', true);
            cap.setUIState('uiid-3225002844347601', "edit");
            cap.disValid('uiid-3225002844347601', false);
            cap.setUIState('contractUnitName', "disabled");
            cap.disValid('contractUnitName', true);
            cap.setUIState('uiid-7517809052686995', "edit");
            cap.disValid('uiid-7517809052686995', false);
            cap.setUIState('stopScope1', "edit");
            cap.disValid('stopScope1', false);
            cap.setUIState('uiid-9020901305186854', "edit");
            cap.disValid('uiid-9020901305186854', false);
            cap.setUIState('stopTime', "edit");
            cap.disValid('stopTime', false);
            cap.setUIState('uiid-61896546028838294', "edit");
            cap.disValid('uiid-61896546028838294', false);
            cap.setUIState('stopFactor', "edit");
            cap.disValid('stopFactor', false);
            cap.setUIState('uiid-7858354842460729', "edit");
            cap.disValid('uiid-7858354842460729', false);
            cap.setUIState('reformRequire', "edit");
            cap.disValid('reformRequire', false);
            cap.setUIState('uiid-878512144423062', "edit");
            cap.disValid('uiid-878512144423062', false);
            cap.setUIState('notificeType', "edit");
            cap.disValid('notificeType', false);
            cap.setUIState('uiid-9891167705217036', "edit");
            cap.disValid('uiid-9891167705217036', false);
            cap.setUIState('notificeTime', "edit");
            cap.disValid('notificeTime', false);
            cap.setUIState('uiid-9691821450037213', "edit");
            cap.disValid('uiid-9691821450037213', false);
            cap.setUIState('acceptor', "edit");
            cap.disValid('acceptor', false);
            cap.setUIState('uiid-27956094455812778', "edit");
            cap.disValid('uiid-27956094455812778', false);
            cap.setUIState('implementation1', "edit");
            cap.disValid('implementation1', false);
            cap.setUIState('uiid-7222751177204276', "edit");
            cap.disValid('uiid-7222751177204276', false);
            cap.setUIState('completion1', "edit");
            cap.disValid('completion1', false);
            cap.setUIState('uiid-3911445665005044', "edit");
            cap.disValid('uiid-3911445665005044', false);
            cap.setUIState('actualStopTime1', "edit");
            cap.disValid('actualStopTime1', false);
        }
        if(pageMode=='detail'&&flowState ==0){
            cap.setUIState('btn-save', "hide");
            cap.disValid('btn-save', true);
            cap.setUIState('uiid-5818410204203266', "edit");
            cap.disValid('uiid-5818410204203266', false);
            cap.setUIState('btn-view-track', "hide");
            cap.disValid('btn-view-track', true);
            cap.setUIState('btn-send-edit', "hide");
            cap.disValid('btn-send-edit', true);
            cap.setUIState('btn-back-edit', "hide");
            cap.disValid('btn-back-edit', true);
            cap.setUIState('btn-save-and-entry', "hide");
            cap.disValid('btn-save-and-entry', true);
            cap.setUIState('uiid-16928987589683256', "edit");
            cap.disValid('uiid-16928987589683256', false);
            cap.setUIState('uiid-8706129490738827', "edit");
            cap.disValid('uiid-8706129490738827', false);
            cap.setUIState('projectName1', "textmode");
            cap.disValid('projectName1', true);
            cap.setUIState('uiid-8483321942598772', "edit");
            cap.disValid('uiid-8483321942598772', false);
            cap.setUIState('projectCode1', "textmode");
            cap.disValid('projectCode1', true);
            cap.setUIState('uiid-59363636936275185', "edit");
            cap.disValid('uiid-59363636936275185', false);
            cap.setUIState('engineerName1', "textmode");
            cap.disValid('engineerName1', true);
            cap.setUIState('uiid-4207865224787513', "edit");
            cap.disValid('uiid-4207865224787513', false);
            cap.setUIState('engineerCode1', "textmode");
            cap.disValid('engineerCode1', true);
            cap.setUIState('uiid-27031893041088843', "edit");
            cap.disValid('uiid-27031893041088843', false);
            cap.setUIState('sectionName1', "textmode");
            cap.disValid('sectionName1', true);
            cap.setUIState('uiid-56354278314021805', "edit");
            cap.disValid('uiid-56354278314021805', false);
            cap.setUIState('voltageGradeStr', "textmode");
            cap.disValid('voltageGradeStr', true);
            cap.setUIState('uiid-3735951587508117', "edit");
            cap.disValid('uiid-3735951587508117', false);
            cap.setUIState('projectTypeName', "textmode");
            cap.disValid('projectTypeName', true);
            cap.setUIState('uiid-8636564825772874', "edit");
            cap.disValid('uiid-8636564825772874', false);
            cap.setUIState('nature', "textmode");
            cap.disValid('nature', true);
            cap.setUIState('uiid-11656121789592568', "edit");
            cap.disValid('uiid-11656121789592568', false);
            cap.setUIState('consDept', "textmode");
            cap.disValid('consDept', true);
            cap.setUIState('uiid-3263645827699762', "edit");
            cap.disValid('uiid-3263645827699762', false);
            cap.setUIState('departmentName', "textmode");
            cap.disValid('departmentName', true);
            cap.setUIState('uiid-42703755920931904', "edit");
            cap.disValid('uiid-42703755920931904', false);
            cap.setUIState('projectCharger', "textmode");
            cap.disValid('projectCharger', true);
            cap.setUIState('uiid-12004694252090236', "edit");
            cap.disValid('uiid-12004694252090236', false);
            cap.setUIState('projectManagerPhone', "textmode");
            cap.disValid('projectManagerPhone', true);
            cap.setUIState('uiid-57937326935217754', "edit");
            cap.disValid('uiid-57937326935217754', false);
            cap.setUIState('supervisionName', "textmode");
            cap.disValid('supervisionName', true);
            cap.setUIState('uiid-4593560993693706', "edit");
            cap.disValid('uiid-4593560993693706', false);
            cap.setUIState('supervisionDepartment', "textmode");
            cap.disValid('supervisionDepartment', true);
            cap.setUIState('uiid-2716559415709033', "edit");
            cap.disValid('uiid-2716559415709033', false);
            cap.setUIState('supervisionUserName', "textmode");
            cap.disValid('supervisionUserName', true);
            cap.setUIState('uiid-20718029637330623', "edit");
            cap.disValid('uiid-20718029637330623', false);
            cap.setUIState('supervisionPhone', "textmode");
            cap.disValid('supervisionPhone', true);
            cap.setUIState('uiid-6489895604216946', "edit");
            cap.disValid('uiid-6489895604216946', false);
            cap.setUIState('constructionName', "textmode");
            cap.disValid('constructionName', true);
            cap.setUIState('uiid-3963698248312586', "edit");
            cap.disValid('uiid-3963698248312586', false);
            cap.setUIState('whetherGeneralContract', "textmode");
            cap.disValid('whetherGeneralContract', true);
            cap.setUIState('uiid-4006580662335257', "edit");
            cap.disValid('uiid-4006580662335257', false);
            cap.setUIState('constructionDepartment', "textmode");
            cap.disValid('constructionDepartment', true);
            cap.setUIState('uiid-2069302618590677', "edit");
            cap.disValid('uiid-2069302618590677', false);
            cap.setUIState('whetherToSubcontract', "textmode");
            cap.disValid('whetherToSubcontract', true);
            cap.setUIState('uiid-7233241223191135', "edit");
            cap.disValid('uiid-7233241223191135', false);
            cap.setUIState('constructionUserName', "textmode");
            cap.disValid('constructionUserName', true);
            cap.setUIState('uiid-1352986506246358', "edit");
            cap.disValid('uiid-1352986506246358', false);
            cap.setUIState('constructionPhone', "textmode");
            cap.disValid('constructionPhone', true);
            cap.setUIState('uiid-6723547501066508', "edit");
            cap.disValid('uiid-6723547501066508', false);
            cap.setUIState('subcontractName', "textmode");
            cap.disValid('subcontractName', true);
            cap.setUIState('uiid-5756069378666568', "edit");
            cap.disValid('uiid-5756069378666568', false);
            cap.setUIState('subcontractUserName', "textmode");
            cap.disValid('subcontractUserName', true);
            cap.setUIState('uiid-52520857034014895', "edit");
            cap.disValid('uiid-52520857034014895', false);
            cap.setUIState('subcontractPhone', "textmode");
            cap.disValid('subcontractPhone', true);
            cap.setUIState('subcontractTable', "hide");
            cap.disValid('subcontractTable', true);
            cap.setUIState('uiid-3225002844347601', "edit");
            cap.disValid('uiid-3225002844347601', false);
            cap.setUIState('contractUnitName', "textmode");
            cap.disValid('contractUnitName', true);
            cap.setUIState('uiid-7517809052686995', "edit");
            cap.disValid('uiid-7517809052686995', false);
            cap.setUIState('stopScope1', "textmode");
            cap.disValid('stopScope1', true);
            cap.setUIState('uiid-9020901305186854', "edit");
            cap.disValid('uiid-9020901305186854', false);
            cap.setUIState('stopTime', "textmode");
            cap.disValid('stopTime', true);
            cap.setUIState('uiid-61896546028838294', "edit");
            cap.disValid('uiid-61896546028838294', false);
            cap.setUIState('stopFactor', "textmode");
            cap.disValid('stopFactor', true);
            cap.setUIState('uiid-7858354842460729', "edit");
            cap.disValid('uiid-7858354842460729', false);
            cap.setUIState('reformRequire', "textmode");
            cap.disValid('reformRequire', true);
            cap.setUIState('uiid-878512144423062', "edit");
            cap.disValid('uiid-878512144423062', false);
            cap.setUIState('notificeType', "textmode");
            cap.disValid('notificeType', true);
            cap.setUIState('uiid-9891167705217036', "edit");
            cap.disValid('uiid-9891167705217036', false);
            cap.setUIState('notificeTime', "textmode");
            cap.disValid('notificeTime', true);
            cap.setUIState('uiid-9691821450037213', "edit");
            cap.disValid('uiid-9691821450037213', false);
            cap.setUIState('acceptor', "textmode");
            cap.disValid('acceptor', true);
            cap.setUIState('uiid-27956094455812778', "edit");
            cap.disValid('uiid-27956094455812778', false);
            cap.setUIState('implementation1', "textmode");
            cap.disValid('implementation1', true);
            cap.setUIState('uiid-7222751177204276', "edit");
            cap.disValid('uiid-7222751177204276', false);
            cap.setUIState('completion1', "textmode");
            cap.disValid('completion1', true);
            cap.setUIState('uiid-3911445665005044', "edit");
            cap.disValid('uiid-3911445665005044', false);
            cap.setUIState('actualStopTime1', "textmode");
            cap.disValid('actualStopTime1', true);
        }
        if(pageMode=='detail'&&flowState !=0){
            cap.setUIState('btn-save', "hide");
            cap.disValid('btn-save', true);
            cap.setUIState('uiid-5818410204203266', "edit");
            cap.disValid('uiid-5818410204203266', false);
            cap.setUIState('btn-view-track', "edit");
            cap.disValid('btn-view-track', false);
            cap.setUIState('btn-send-edit', "hide");
            cap.disValid('btn-send-edit', true);
            cap.setUIState('btn-back-edit', "hide");
            cap.disValid('btn-back-edit', true);
            cap.setUIState('btn-save-and-entry', "hide");
            cap.disValid('btn-save-and-entry', true);
            cap.setUIState('uiid-16928987589683256', "edit");
            cap.disValid('uiid-16928987589683256', false);
            cap.setUIState('uiid-8706129490738827', "edit");
            cap.disValid('uiid-8706129490738827', false);
            cap.setUIState('projectName1', "textmode");
            cap.disValid('projectName1', true);
            cap.setUIState('uiid-8483321942598772', "edit");
            cap.disValid('uiid-8483321942598772', false);
            cap.setUIState('projectCode1', "textmode");
            cap.disValid('projectCode1', true);
            cap.setUIState('uiid-59363636936275185', "edit");
            cap.disValid('uiid-59363636936275185', false);
            cap.setUIState('engineerName1', "textmode");
            cap.disValid('engineerName1', true);
            cap.setUIState('uiid-4207865224787513', "edit");
            cap.disValid('uiid-4207865224787513', false);
            cap.setUIState('engineerCode1', "textmode");
            cap.disValid('engineerCode1', true);
            cap.setUIState('uiid-27031893041088843', "edit");
            cap.disValid('uiid-27031893041088843', false);
            cap.setUIState('sectionName1', "textmode");
            cap.disValid('sectionName1', true);
            cap.setUIState('uiid-56354278314021805', "edit");
            cap.disValid('uiid-56354278314021805', false);
            cap.setUIState('voltageGradeStr', "textmode");
            cap.disValid('voltageGradeStr', true);
            cap.setUIState('uiid-3735951587508117', "edit");
            cap.disValid('uiid-3735951587508117', false);
            cap.setUIState('projectTypeName', "textmode");
            cap.disValid('projectTypeName', true);
            cap.setUIState('uiid-8636564825772874', "edit");
            cap.disValid('uiid-8636564825772874', false);
            cap.setUIState('nature', "textmode");
            cap.disValid('nature', true);
            cap.setUIState('uiid-11656121789592568', "edit");
            cap.disValid('uiid-11656121789592568', false);
            cap.setUIState('consDept', "textmode");
            cap.disValid('consDept', true);
            cap.setUIState('uiid-3263645827699762', "edit");
            cap.disValid('uiid-3263645827699762', false);
            cap.setUIState('departmentName', "textmode");
            cap.disValid('departmentName', true);
            cap.setUIState('uiid-42703755920931904', "edit");
            cap.disValid('uiid-42703755920931904', false);
            cap.setUIState('projectCharger', "textmode");
            cap.disValid('projectCharger', true);
            cap.setUIState('uiid-12004694252090236', "edit");
            cap.disValid('uiid-12004694252090236', false);
            cap.setUIState('projectManagerPhone', "textmode");
            cap.disValid('projectManagerPhone', true);
            cap.setUIState('uiid-57937326935217754', "edit");
            cap.disValid('uiid-57937326935217754', false);
            cap.setUIState('supervisionName', "textmode");
            cap.disValid('supervisionName', true);
            cap.setUIState('uiid-4593560993693706', "edit");
            cap.disValid('uiid-4593560993693706', false);
            cap.setUIState('supervisionDepartment', "textmode");
            cap.disValid('supervisionDepartment', true);
            cap.setUIState('uiid-2716559415709033', "edit");
            cap.disValid('uiid-2716559415709033', false);
            cap.setUIState('supervisionUserName', "textmode");
            cap.disValid('supervisionUserName', true);
            cap.setUIState('uiid-20718029637330623', "edit");
            cap.disValid('uiid-20718029637330623', false);
            cap.setUIState('supervisionPhone', "textmode");
            cap.disValid('supervisionPhone', true);
            cap.setUIState('uiid-6489895604216946', "edit");
            cap.disValid('uiid-6489895604216946', false);
            cap.setUIState('constructionName', "textmode");
            cap.disValid('constructionName', true);
            cap.setUIState('uiid-3963698248312586', "edit");
            cap.disValid('uiid-3963698248312586', false);
            cap.setUIState('whetherGeneralContract', "textmode");
            cap.disValid('whetherGeneralContract', true);
            cap.setUIState('uiid-4006580662335257', "edit");
            cap.disValid('uiid-4006580662335257', false);
            cap.setUIState('constructionDepartment', "textmode");
            cap.disValid('constructionDepartment', true);
            cap.setUIState('uiid-2069302618590677', "edit");
            cap.disValid('uiid-2069302618590677', false);
            cap.setUIState('whetherToSubcontract', "textmode");
            cap.disValid('whetherToSubcontract', true);
            cap.setUIState('uiid-7233241223191135', "edit");
            cap.disValid('uiid-7233241223191135', false);
            cap.setUIState('constructionUserName', "textmode");
            cap.disValid('constructionUserName', true);
            cap.setUIState('uiid-1352986506246358', "edit");
            cap.disValid('uiid-1352986506246358', false);
            cap.setUIState('constructionPhone', "textmode");
            cap.disValid('constructionPhone', true);
            cap.setUIState('uiid-6723547501066508', "edit");
            cap.disValid('uiid-6723547501066508', false);
            cap.setUIState('subcontractName', "textmode");
            cap.disValid('subcontractName', true);
            cap.setUIState('uiid-5756069378666568', "edit");
            cap.disValid('uiid-5756069378666568', false);
            cap.setUIState('subcontractUserName', "textmode");
            cap.disValid('subcontractUserName', true);
            cap.setUIState('uiid-52520857034014895', "edit");
            cap.disValid('uiid-52520857034014895', false);
            cap.setUIState('subcontractPhone', "textmode");
            cap.disValid('subcontractPhone', true);
            cap.setUIState('subcontractTable', "hide");
            cap.disValid('subcontractTable', true);
            cap.setUIState('uiid-3225002844347601', "edit");
            cap.disValid('uiid-3225002844347601', false);
            cap.setUIState('contractUnitName', "textmode");
            cap.disValid('contractUnitName', true);
            cap.setUIState('uiid-7517809052686995', "edit");
            cap.disValid('uiid-7517809052686995', false);
            cap.setUIState('stopScope1', "textmode");
            cap.disValid('stopScope1', true);
            cap.setUIState('uiid-9020901305186854', "edit");
            cap.disValid('uiid-9020901305186854', false);
            cap.setUIState('stopTime', "textmode");
            cap.disValid('stopTime', true);
            cap.setUIState('uiid-61896546028838294', "edit");
            cap.disValid('uiid-61896546028838294', false);
            cap.setUIState('stopFactor', "textmode");
            cap.disValid('stopFactor', true);
            cap.setUIState('uiid-7858354842460729', "edit");
            cap.disValid('uiid-7858354842460729', false);
            cap.setUIState('reformRequire', "textmode");
            cap.disValid('reformRequire', true);
            cap.setUIState('uiid-878512144423062', "edit");
            cap.disValid('uiid-878512144423062', false);
            cap.setUIState('notificeType', "textmode");
            cap.disValid('notificeType', true);
            cap.setUIState('uiid-9891167705217036', "edit");
            cap.disValid('uiid-9891167705217036', false);
            cap.setUIState('notificeTime', "textmode");
            cap.disValid('notificeTime', true);
            cap.setUIState('uiid-9691821450037213', "edit");
            cap.disValid('uiid-9691821450037213', false);
            cap.setUIState('acceptor', "textmode");
            cap.disValid('acceptor', true);
            cap.setUIState('uiid-27956094455812778', "edit");
            cap.disValid('uiid-27956094455812778', false);
            cap.setUIState('implementation1', "textmode");
            cap.disValid('implementation1', true);
            cap.setUIState('uiid-7222751177204276', "edit");
            cap.disValid('uiid-7222751177204276', false);
            cap.setUIState('completion1', "textmode");
            cap.disValid('completion1', true);
            cap.setUIState('uiid-3911445665005044', "edit");
            cap.disValid('uiid-3911445665005044', false);
            cap.setUIState('actualStopTime1', "textmode");
            cap.disValid('actualStopTime1', true);
        }
        if(pageMode=='todo'){
            cap.setUIState('btn-save', "hide");
            cap.disValid('btn-save', true);
            cap.setUIState('uiid-5818410204203266', "hide");
            cap.disValid('uiid-5818410204203266', true);
            cap.setUIState('btn-view-track', "hide");
            cap.disValid('btn-view-track', true);
            cap.setUIState('btn-send-edit', "edit");
            cap.disValid('btn-send-edit', false);
            cap.setUIState('btn-back-edit', "edit");
            cap.disValid('btn-back-edit', false);
            cap.setUIState('btn-save-and-entry', "hide");
            cap.disValid('btn-save-and-entry', true);
            cap.setUIState('uiid-16928987589683256', "edit");
            cap.disValid('uiid-16928987589683256', false);
            cap.setUIState('uiid-8706129490738827', "edit");
            cap.disValid('uiid-8706129490738827', false);
            cap.setUIState('projectName1', "textmode");
            cap.disValid('projectName1', true);
            cap.setUIState('uiid-8483321942598772', "edit");
            cap.disValid('uiid-8483321942598772', false);
            cap.setUIState('projectCode1', "textmode");
            cap.disValid('projectCode1', true);
            cap.setUIState('uiid-59363636936275185', "edit");
            cap.disValid('uiid-59363636936275185', false);
            cap.setUIState('engineerName1', "textmode");
            cap.disValid('engineerName1', true);
            cap.setUIState('uiid-4207865224787513', "edit");
            cap.disValid('uiid-4207865224787513', false);
            cap.setUIState('engineerCode1', "textmode");
            cap.disValid('engineerCode1', true);
            cap.setUIState('uiid-27031893041088843', "edit");
            cap.disValid('uiid-27031893041088843', false);
            cap.setUIState('sectionName1', "textmode");
            cap.disValid('sectionName1', true);
            cap.setUIState('uiid-56354278314021805', "edit");
            cap.disValid('uiid-56354278314021805', false);
            cap.setUIState('voltageGradeStr', "textmode");
            cap.disValid('voltageGradeStr', true);
            cap.setUIState('uiid-3735951587508117', "edit");
            cap.disValid('uiid-3735951587508117', false);
            cap.setUIState('projectTypeName', "textmode");
            cap.disValid('projectTypeName', true);
            cap.setUIState('uiid-8636564825772874', "edit");
            cap.disValid('uiid-8636564825772874', false);
            cap.setUIState('nature', "textmode");
            cap.disValid('nature', true);
            cap.setUIState('uiid-11656121789592568', "edit");
            cap.disValid('uiid-11656121789592568', false);
            cap.setUIState('consDept', "textmode");
            cap.disValid('consDept', true);
            cap.setUIState('uiid-3263645827699762', "edit");
            cap.disValid('uiid-3263645827699762', false);
            cap.setUIState('departmentName', "textmode");
            cap.disValid('departmentName', true);
            cap.setUIState('uiid-42703755920931904', "edit");
            cap.disValid('uiid-42703755920931904', false);
            cap.setUIState('projectCharger', "textmode");
            cap.disValid('projectCharger', true);
            cap.setUIState('uiid-12004694252090236', "edit");
            cap.disValid('uiid-12004694252090236', false);
            cap.setUIState('projectManagerPhone', "textmode");
            cap.disValid('projectManagerPhone', true);
            cap.setUIState('uiid-57937326935217754', "edit");
            cap.disValid('uiid-57937326935217754', false);
            cap.setUIState('supervisionName', "textmode");
            cap.disValid('supervisionName', true);
            cap.setUIState('uiid-4593560993693706', "edit");
            cap.disValid('uiid-4593560993693706', false);
            cap.setUIState('supervisionDepartment', "textmode");
            cap.disValid('supervisionDepartment', true);
            cap.setUIState('uiid-2716559415709033', "edit");
            cap.disValid('uiid-2716559415709033', false);
            cap.setUIState('supervisionUserName', "textmode");
            cap.disValid('supervisionUserName', true);
            cap.setUIState('uiid-20718029637330623', "edit");
            cap.disValid('uiid-20718029637330623', false);
            cap.setUIState('supervisionPhone', "textmode");
            cap.disValid('supervisionPhone', true);
            cap.setUIState('uiid-6489895604216946', "edit");
            cap.disValid('uiid-6489895604216946', false);
            cap.setUIState('constructionName', "textmode");
            cap.disValid('constructionName', true);
            cap.setUIState('uiid-3963698248312586', "edit");
            cap.disValid('uiid-3963698248312586', false);
            cap.setUIState('whetherGeneralContract', "textmode");
            cap.disValid('whetherGeneralContract', true);
            cap.setUIState('uiid-4006580662335257', "edit");
            cap.disValid('uiid-4006580662335257', false);
            cap.setUIState('constructionDepartment', "textmode");
            cap.disValid('constructionDepartment', true);
            cap.setUIState('uiid-2069302618590677', "edit");
            cap.disValid('uiid-2069302618590677', false);
            cap.setUIState('whetherToSubcontract', "textmode");
            cap.disValid('whetherToSubcontract', true);
            cap.setUIState('uiid-7233241223191135', "edit");
            cap.disValid('uiid-7233241223191135', false);
            cap.setUIState('constructionUserName', "textmode");
            cap.disValid('constructionUserName', true);
            cap.setUIState('uiid-1352986506246358', "edit");
            cap.disValid('uiid-1352986506246358', false);
            cap.setUIState('constructionPhone', "textmode");
            cap.disValid('constructionPhone', true);
            cap.setUIState('uiid-6723547501066508', "edit");
            cap.disValid('uiid-6723547501066508', false);
            cap.setUIState('subcontractName', "textmode");
            cap.disValid('subcontractName', true);
            cap.setUIState('uiid-5756069378666568', "edit");
            cap.disValid('uiid-5756069378666568', false);
            cap.setUIState('subcontractUserName', "textmode");
            cap.disValid('subcontractUserName', true);
            cap.setUIState('uiid-52520857034014895', "edit");
            cap.disValid('uiid-52520857034014895', false);
            cap.setUIState('subcontractPhone', "textmode");
            cap.disValid('subcontractPhone', true);
            cap.setUIState('subcontractTable', "hide");
            cap.disValid('subcontractTable', true);
            cap.setUIState('uiid-3225002844347601', "edit");
            cap.disValid('uiid-3225002844347601', false);
            cap.setUIState('contractUnitName', "textmode");
            cap.disValid('contractUnitName', true);
            cap.setUIState('uiid-7517809052686995', "edit");
            cap.disValid('uiid-7517809052686995', false);
            cap.setUIState('stopScope1', "textmode");
            cap.disValid('stopScope1', true);
            cap.setUIState('uiid-9020901305186854', "edit");
            cap.disValid('uiid-9020901305186854', false);
            cap.setUIState('stopTime', "textmode");
            cap.disValid('stopTime', true);
            cap.setUIState('uiid-61896546028838294', "edit");
            cap.disValid('uiid-61896546028838294', false);
            cap.setUIState('stopFactor', "textmode");
            cap.disValid('stopFactor', true);
            cap.setUIState('uiid-7858354842460729', "edit");
            cap.disValid('uiid-7858354842460729', false);
            cap.setUIState('reformRequire', "textmode");
            cap.disValid('reformRequire', true);
            cap.setUIState('uiid-878512144423062', "edit");
            cap.disValid('uiid-878512144423062', false);
            cap.setUIState('notificeType', "textmode");
            cap.disValid('notificeType', true);
            cap.setUIState('uiid-9891167705217036', "edit");
            cap.disValid('uiid-9891167705217036', false);
            cap.setUIState('notificeTime', "textmode");
            cap.disValid('notificeTime', true);
            cap.setUIState('uiid-9691821450037213', "edit");
            cap.disValid('uiid-9691821450037213', false);
            cap.setUIState('acceptor', "textmode");
            cap.disValid('acceptor', true);
            cap.setUIState('uiid-27956094455812778', "edit");
            cap.disValid('uiid-27956094455812778', false);
            cap.setUIState('implementation1', "textmode");
            cap.disValid('implementation1', true);
            cap.setUIState('uiid-7222751177204276', "edit");
            cap.disValid('uiid-7222751177204276', false);
            cap.setUIState('completion1', "textmode");
            cap.disValid('completion1', true);
            cap.setUIState('uiid-3911445665005044', "edit");
            cap.disValid('uiid-3911445665005044', false);
            cap.setUIState('actualStopTime1', "textmode");
            cap.disValid('actualStopTime1', true);
        }
    }
    
    //页面控件属性配置
    cap.uiConfig = {
	    "uiid-2513114274703336":{
	        "uitype":"label",
	        "text":"工程暂停令",
	        "isReddot":false,
	        "id":"uiid-2513114274703336"
	    },
	    "btn-save":{
	        "uitype":"button",
	        "icon":"gmp gmp-icon-btn_save",
	        "isPrimary":true,
	        "theme":"default",
	        "isRound":false,
	        "isLoading":false,
	        "id":"btn-save",
	        "onClick":saveForm
	    },
	    "uiid-5818410204203266":{
	        "uitype":"button",
	        "isPrimary":false,
	        "theme":"default",
	        "isRound":false,
	        "isLoading":false,
	        "id":"uiid-5818410204203266",
	        "onClick":onClick
	    },
	    "btn-view-track":{
	        "uitype":"button",
	        "icon":"gmp gmp-icon-btn_recordtoreport",
	        "isPrimary":false,
	        "theme":"default",
	        "isRound":false,
	        "isLoading":false,
	        "id":"btn-view-track",
	        "onClick":viewTrackEdit
	    },
	    "btn-send-edit":{
	        "uitype":"button",
	        "isPrimary":false,
	        "theme":"default",
	        "isRound":false,
	        "isLoading":false,
	        "id":"btn-send-edit",
	        "onClick":sendEditData
	    },
	    "btn-back-edit":{
	        "uitype":"button",
	        "isPrimary":false,
	        "theme":"default",
	        "isRound":false,
	        "isLoading":false,
	        "id":"btn-back-edit",
	        "onClick":backEditData
	    },
	    "btn-save-and-entry":{
	        "uitype":"button",
	        "icon":"gmp gmp-icon-btn_report",
	        "isPrimary":false,
	        "theme":"default",
	        "isRound":false,
	        "isLoading":false,
	        "id":"btn-save-and-entry",
	        "onClick":saveAndEntrytAudit
	    },
	    "uiid-16928987589683256":{
	        "uitype":"button",
	        "icon":"gmp gmp-icon-btn_fanhui",
	        "isPrimary":false,
	        "theme":"default",
	        "isRound":false,
	        "isLoading":false,
	        "id":"uiid-16928987589683256",
	        "onClick":backTo
	    },
	    "maodianDiv":{
	        "uitype":"anchor",
	        "openIcon":"gmp gmp-icon-btn_write_preview",
	        "closeIcon":"gmp gmp-icon-btn_write_unpreview",
	        "scrollBox":"html,body",
	        "level1Selector":".c5-shrink-panel",
	        "level2Selector":".c5-shrink-panel",
	        "maxCheckTimes":20,
	        "data":[{    name: "项目基本信息",    target: "#colid-8874269772391807"},{    name: "暂停令信息",    target: "#colid-4141928123983182"},{    name: "执行确认信息",    target: "#colid-8461795586116098"}],
	        "status":"open",
	        "fixed":true,
	        "id":"maodianDiv"
	    },
	    "uiid-6041217822276499":{
	        "uitype":"whiteBgTitleToggle",
	        "fontWeight":"bold",
	        "fontSize":"18px",
	        "name":"项目基本信息",
	        "relationArea":"#lyid-35413352991230745",
	        "isThirdType":true
	    },
	    "uiid-8706129490738827":{
	        "uitype":"label",
	        "text":"项目名称：",
	        "isReddot":true
	    },
	    "projectName1":{
	        "uitype":"input",
	        "databind":"proStopRsp.projectName",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"strictRequired","value":true,"message":"项目名称不能为空。"},{"rule":"maxlength","value":255,"message":"项目名称长度不能大于255个字。"}],"validateWrap":"#colid-3537764359557174","tipsFollow":"#colid-3537764359557174"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"projectName",
	        "id":"projectName1"
	    },
	    "uiid-8483321942598772":{
	        "uitype":"label",
	        "text":"项目编码：",
	        "isReddot":false
	    },
	    "projectCode1":{
	        "uitype":"input",
	        "databind":"proStopRsp.projectCode",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":20,"message":"项目编码长度不能大于20个字。"}],"validateWrap":"#colid-5191747720453468","tipsFollow":"#colid-5191747720453468"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"projectCode",
	        "id":"projectCode1"
	    },
	    "uiid-59363636936275185":{
	        "uitype":"label",
	        "text":"单项工程名称：",
	        "isReddot":false
	    },
	    "engineerName1":{
	        "uitype":"input",
	        "databind":"proStopRsp.engineerName",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":255,"message":"单项工程名称长度不能大于255个字。"}],"validateWrap":"#colid-4195694843859574","tipsFollow":"#colid-4195694843859574"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"engineerName",
	        "id":"engineerName1"
	    },
	    "uiid-4207865224787513":{
	        "uitype":"label",
	        "text":"单项工程编码：",
	        "isReddot":false
	    },
	    "engineerCode1":{
	        "uitype":"input",
	        "databind":"proStopRsp.engineerCode",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":255,"message":"单项工程编码长度不能大于255个字。"}],"validateWrap":"#colid-52114604683518294","tipsFollow":"#colid-52114604683518294"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"engineerCode",
	        "id":"engineerCode1"
	    },
	    "uiid-27031893041088843":{
	        "uitype":"label",
	        "text":"所属标段：",
	        "isReddot":true,
	        "id":"uiid-27031893041088843"
	    },
	    "sectionName1":{
	        "uitype":"input",
	        "databind":"proStopRsp.sectionName",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":"255","message":"标段名称长度不能大于255个字。"},{"rule":"required","value":true,"message":"必填"}],"validateWrap":"#colid-9202854397787777","tipsFollow":"#colid-9202854397787777"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "suffixIcon":"list-ul",
	        "name":"sectionName",
	        "id":"sectionName1",
	        "onFocus":onFocus
	    },
	    "uiid-56354278314021805":{
	        "uitype":"label",
	        "text":"电压等级：",
	        "isReddot":false
	    },
	    "voltageGradeStr":{
	        "uitype":"input",
	        "databind":"proStopRsp.voltageGradeStr",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"voltageGradeStr",
	        "id":"voltageGradeStr"
	    },
	    "uiid-3735951587508117":{
	        "uitype":"label",
	        "text":"项目类型：",
	        "isReddot":false
	    },
	    "projectTypeName":{
	        "uitype":"input",
	        "databind":"proStopRsp.projectTypeName",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"projectTypeName",
	        "id":"projectTypeName"
	    },
	    "uiid-8636564825772874":{
	        "uitype":"label",
	        "text":"项目性质：",
	        "isReddot":false
	    },
	    "nature":{
	        "uitype":"input",
	        "databind":"proStopRsp.nature",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"nature",
	        "id":"nature"
	    },
	    "uiid-11656121789592568":{
	        "uitype":"label",
	        "text":"建设单位：",
	        "isReddot":false
	    },
	    "consDept":{
	        "uitype":"input",
	        "databind":"proStopRsp.consDept",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":64,"message":"建设单位名称长度不能大于64个字。"}],"validateWrap":"#colid-6381995732688615","tipsFollow":"#colid-6381995732688615"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"consDept",
	        "id":"consDept"
	    },
	    "uiid-3263645827699762":{
	        "uitype":"label",
	        "text":"业主项目部：",
	        "isReddot":false
	    },
	    "departmentName":{
	        "uitype":"input",
	        "databind":"proStopRsp.departmentName",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":40,"message":"业主项目部名称长度不能大于40个字。"}],"validateWrap":"#colid-2877057977558235","tipsFollow":"#colid-2877057977558235"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"departmentName",
	        "id":"departmentName"
	    },
	    "uiid-42703755920931904":{
	        "uitype":"label",
	        "text":"业主项目经理：",
	        "isReddot":false
	    },
	    "projectCharger":{
	        "uitype":"input",
	        "databind":"proStopRsp.projectCharger",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":64,"message":"业主项目经理姓名长度不能大于64个字。"}],"validateWrap":"#colid-4627137829367465","tipsFollow":"#colid-4627137829367465"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"projectCharger",
	        "id":"projectCharger"
	    },
	    "uiid-12004694252090236":{
	        "uitype":"label",
	        "text":"联系电话：",
	        "isReddot":false
	    },
	    "projectManagerPhone":{
	        "uitype":"input",
	        "databind":"proStopRsp.projectManagerPhone",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"projectManagerPhone",
	        "id":"projectManagerPhone"
	    },
	    "uiid-57937326935217754":{
	        "uitype":"label",
	        "text":"监理单位：",
	        "isReddot":false
	    },
	    "supervisionName":{
	        "uitype":"input",
	        "databind":"proStopRsp.supervisionName",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":40,"message":"监理单位名称长度不能大于40个字。"}],"validateWrap":"#colid-1972294633370222","tipsFollow":"#colid-1972294633370222"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"supervisionName",
	        "id":"supervisionName"
	    },
	    "uiid-4593560993693706":{
	        "uitype":"label",
	        "text":"监理项目部：",
	        "isReddot":false
	    },
	    "supervisionDepartment":{
	        "uitype":"input",
	        "databind":"proStopRsp.supervisionDepartment",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"supervisionDepartment",
	        "id":"supervisionDepartment"
	    },
	    "uiid-2716559415709033":{
	        "uitype":"label",
	        "text":"总监：",
	        "isReddot":false
	    },
	    "supervisionUserName":{
	        "uitype":"input",
	        "databind":"proStopRsp.supervisionUserName",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":40,"message":"监理单位负责人名称长度不能大于40个字。"}],"validateWrap":"#colid-4878775236459341","tipsFollow":"#colid-4878775236459341"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"supervisionUserName",
	        "id":"supervisionUserName"
	    },
	    "uiid-20718029637330623":{
	        "uitype":"label",
	        "text":"联系电话：",
	        "isReddot":false
	    },
	    "supervisionPhone":{
	        "uitype":"input",
	        "databind":"proStopRsp.supervisionPhone",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"supervisionPhone",
	        "id":"supervisionPhone"
	    },
	    "uiid-6489895604216946":{
	        "uitype":"label",
	        "text":"施工单位：",
	        "isReddot":false
	    },
	    "constructionName":{
	        "uitype":"input",
	        "databind":"proStopRsp.constructionName",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"constructionName",
	        "id":"constructionName"
	    },
	    "uiid-3963698248312586":{
	        "uitype":"label",
	        "text":"是否总承包：",
	        "isReddot":false
	    },
	    "whetherGeneralContract":{
	        "uitype":"input",
	        "databind":"proStopRsp.whetherGeneralContract",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"whetherGeneralContract",
	        "id":"whetherGeneralContract"
	    },
	    "uiid-4006580662335257":{
	        "uitype":"label",
	        "text":"施工项目部：",
	        "isReddot":false
	    },
	    "constructionDepartment":{
	        "uitype":"input",
	        "databind":"proStopRsp.constructionDepartment",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"constructionDepartment",
	        "id":"constructionDepartment"
	    },
	    "uiid-2069302618590677":{
	        "uitype":"label",
	        "text":"是否分包：",
	        "isReddot":false
	    },
	    "whetherToSubcontract":{
	        "uitype":"input",
	        "databind":"proStopRsp.whetherToSubcontract",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"whetherToSubcontract",
	        "id":"whetherToSubcontract"
	    },
	    "uiid-7233241223191135":{
	        "uitype":"label",
	        "text":"施工项目经理：",
	        "isReddot":false
	    },
	    "constructionUserName":{
	        "uitype":"input",
	        "databind":"proStopRsp.constructionUserName",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":64,"message":"施工单位负责人名称长度不能大于64个字。"}],"validateWrap":"#colid-4383746546347305","tipsFollow":"#colid-4383746546347305"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"constructionUserName",
	        "id":"constructionUserName"
	    },
	    "uiid-1352986506246358":{
	        "uitype":"label",
	        "text":"联系电话：",
	        "isReddot":false
	    },
	    "constructionPhone":{
	        "uitype":"input",
	        "databind":"proStopRsp.constructionPhone",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"constructionPhone",
	        "id":"constructionPhone"
	    },
	    "uiid-6723547501066508":{
	        "uitype":"label",
	        "text":"分包单位：",
	        "isReddot":false,
	        "id":"uiid-6723547501066508"
	    },
	    "subcontractName":{
	        "uitype":"input",
	        "databind":"subcontract.subcontractName",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"subcontractName",
	        "id":"subcontractName"
	    },
	    "uiid-5756069378666568":{
	        "uitype":"label",
	        "text":"负责人姓名：",
	        "isReddot":false,
	        "id":"uiid-5756069378666568"
	    },
	    "subcontractUserName":{
	        "uitype":"input",
	        "databind":"subcontract.subcontractUserName",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"subcontractUserName",
	        "id":"subcontractUserName"
	    },
	    "uiid-52520857034014895":{
	        "uitype":"label",
	        "text":"分包单位负责人电话：",
	        "isReddot":false,
	        "id":"uiid-52520857034014895"
	    },
	    "subcontractPhone":{
	        "uitype":"input",
	        "databind":"subcontract.subcontractPhone",
	        "width":"200px",
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"subcontractPhone",
	        "id":"subcontractPhone"
	    },
	    "subcontractTable":{
	        "uitype":"table",
	        "columns":[{"title":"分包单位","field":"subcontractName","clickToSelect":false,"escape":false},{"title":"分包单位负责人姓名","field":"subcontractUserName"},{"title":"分包单位负责人电话","field":"subcontractPhone"}],
	        "selectrows":"false",
	        "boxSite":"left",
	        "sortable":true,
	        "striped":false,
	        "bordered":true,
	        "ellipsis":true,
	        "pager":false,
	        "showColumns":false,
	        "showFullscreen":false,
	        "escape":true,
	        "clickToSelect":true,
	        "reorderColumns":false,
	        "resizeColumns":true,
	        "search":false,
	        "searchOnEnterKey":false,
	        "id":"subcontractTable"
	    },
	    "uiid-6041217822276499_copy_1_copy_1":{
	        "uitype":"whiteBgTitleToggle",
	        "fontWeight":"bold",
	        "fontSize":"18px",
	        "name":"暂停令信息",
	        "relationArea":"#lyid-6319741033485444",
	        "isThirdType":true
	    },
	    "uiid-3225002844347601":{
	        "uitype":"label",
	        "text":"承包单位名称：",
	        "isReddot":true,
	        "id":"uiid-3225002844347601"
	    },
	    "contractUnitName":{
	        "uitype":"input",
	        "databind":"proStopRsp.contractUnitName",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":255,"message":"承包单位名称长度不能大于255个字。"},{"rule":"strictRequired","value":true,"message":"承包单位名称：不能为空。"}],"validateWrap":"#colid-60806876983900544","tipsFollow":"#colid-6894995405935292"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"contractUnitName",
	        "id":"contractUnitName"
	    },
	    "uiid-7517809052686995":{
	        "uitype":"label",
	        "text":"停工范围：",
	        "isReddot":true,
	        "id":"uiid-7517809052686995"
	    },
	    "stopScope1":{
	        "uitype":"input",
	        "databind":"proStopRsp.stopScope",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":255,"message":"停工范围长度不能大于255个字。"},{"rule":"strictRequired","value":true,"message":"停工范围：不能为空。"}],"validateWrap":"#colid-6894995405935292","tipsFollow":"#colid-7469701409885441"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"stopScope",
	        "id":"stopScope1"
	    },
	    "uiid-9020901305186854":{
	        "uitype":"label",
	        "text":"停工时间：",
	        "isReddot":true,
	        "id":"uiid-9020901305186854"
	    },
	    "stopTime":{
	        "uitype":"datePicker",
	        "databind":"proStopRsp.stopTime",
	        "validate":{"checkRule":[{"rule":"strictRequired","value":true,"message":"停工时间：不能为空。"}],"validateWrap":"#colid-7469701409885441","tipsFollow":"#colid-702862708354509"},
	        "viewMode":0,
	        "minViewMode":0,
	        "autoClose":true,
	        "placeholder":"请选择日期",
	        "width":"200px",
	        "isIconTrigger":true,
	        "hasClearBtn":true,
	        "hasTodayBtn":true,
	        "hasConfirmBtn":false,
	        "locale":"zh_CN",
	        "noCurrent":false,
	        "id":"stopTime"
	    },
	    "uiid-61896546028838294":{
	        "uitype":"label",
	        "text":"停工因素：",
	        "isReddot":true,
	        "id":"uiid-61896546028838294"
	    },
	    "stopFactor":{
	        "uitype":"textarea",
	        "databind":"proStopRsp.stopFactor",
	        "validate":{"checkRule":[{"rule":"maxlength","value":128,"message":"停工因素长度不能大于128个字。"},{"rule":"strictRequired","value":true,"message":"停工因素：不能为空。"}],"validateWrap":"#colid-702862708354509","tipsFollow":"#colid-5581682271430769"},
	        "name":"stopFactor",
	        "width":"200px",
	        "autoFocus":false,
	        "id":"stopFactor"
	    },
	    "uiid-7858354842460729":{
	        "uitype":"label",
	        "text":"整改要求：",
	        "isReddot":true,
	        "id":"uiid-7858354842460729"
	    },
	    "reformRequire":{
	        "uitype":"textarea",
	        "databind":"proStopRsp.reformRequire",
	        "validate":{"checkRule":[{"rule":"maxlength","value":1024,"message":"整改要求长度不能大于1024个字。"},{"rule":"strictRequired","value":true,"message":"整改要求：不能为空。"}],"validateWrap":"#colid-5581682271430769","tipsFollow":"#colid-8447787942270156"},
	        "name":"reformRequire",
	        "width":"200px",
	        "autoFocus":false,
	        "id":"reformRequire"
	    },
	    "uiid-878512144423062":{
	        "uitype":"label",
	        "text":"通知方式：",
	        "isReddot":false
	    },
	    "notificeType":{
	        "uitype":"check",
	        "databind":"proStopRsp.notificeType",
	        "validate":{"checkRule":[{"rule":"maxlength","value":40,"message":"通知方式(来源字典):1-口头、2-电话长度不能大于40个字。"}],"validateWrap":"#colid-8447787942270156","tipsFollow":"#colid-4770257381922187"},
	        "type":"checkbox",
	        "name":"proStopRsp.notificeType",
	        "data":zhgcReqDict,
	        "isBorder":false,
	        "isButton":false,
	        "idAlias":"dicVal",
	        "valueAlias":"dicName",
	        "id":"notificeType"
	    },
	    "uiid-9891167705217036":{
	        "uitype":"label",
	        "text":"通知时间：",
	        "isReddot":false
	    },
	    "notificeTime":{
	        "uitype":"datePicker",
	        "databind":"proStopRsp.notificeTime",
	        "viewMode":0,
	        "minViewMode":0,
	        "autoClose":true,
	        "placeholder":"请选择日期",
	        "width":"200px",
	        "isIconTrigger":true,
	        "hasClearBtn":true,
	        "hasTodayBtn":true,
	        "hasConfirmBtn":false,
	        "locale":"zh_CN",
	        "noCurrent":false,
	        "id":"notificeTime"
	    },
	    "uiid-9691821450037213":{
	        "uitype":"label",
	        "text":"接受人：",
	        "isReddot":false
	    },
	    "acceptor":{
	        "uitype":"pulldown",
	        "databind":"proStopRsp.acceptor",
	        "data":[],
	        "width":"200px",
	        "isMulti":false,
	        "mustExist":true,
	        "enableFilter":true,
	        "notChangeForDefault":true,
	        "id":"acceptor"
	    },
	    "uiid-3428496493650995":{
	        "uitype":"whiteBgTitleToggle",
	        "fontWeight":"bold",
	        "fontSize":"18px",
	        "name":"执行确认信息",
	        "relationArea":"#lyid-640740440396904",
	        "isThirdType":true
	    },
	    "uiid-27956094455812778":{
	        "uitype":"label",
	        "text":"执行确认：",
	        "isReddot":true
	    },
	    "implementation1":{
	        "uitype":"input",
	        "databind":"proStopRsp.implementation",
	        "width":"200px",
	        "validate":{"checkRule":[{"rule":"maxlength","value":40,"message":"工程暂停令执行确认长度不能大于40个字。"},{"rule":"strictRequired","value":true,"message":"执行确认：不能为空。"}],"validateWrap":"#colid-5438621671266755","tipsFollow":"#colid-5438621671266755"},
	        "align":"left",
	        "type":"text",
	        "autoFocus":false,
	        "name":"implementation",
	        "id":"implementation1"
	    },
	    "uiid-7222751177204276":{
	        "uitype":"label",
	        "text":"停工措施完成情况：",
	        "isReddot":true
	    },
	    "completion1":{
	        "uitype":"textarea",
	        "databind":"proStopRsp.completion",
	        "validate":{"checkRule":[{"rule":"maxlength","value":40,"message":"停工措施完成情况长度不能大于40个字。"},{"rule":"strictRequired","value":true,"message":"停工措施完成情况：不能为空。"}],"validateWrap":"#colid-3478574708496578","tipsFollow":"#colid-3478574708496578"},
	        "name":"completion",
	        "width":"200px",
	        "autoFocus":false,
	        "id":"completion1"
	    },
	    "uiid-3911445665005044":{
	        "uitype":"label",
	        "text":"实际停工时间：",
	        "isReddot":true
	    },
	    "actualStopTime1":{
	        "uitype":"datePicker",
	        "databind":"proStopRsp.actualStopTime",
	        "validate":{"checkRule":[{"rule":"strictRequired","value":true,"message":"实际停工时间：不能为空。"}],"validateWrap":"#colid-11385595608064868","tipsFollow":"#colid-11385595608064868"},
	        "viewMode":0,
	        "minViewMode":0,
	        "autoClose":true,
	        "placeholder":"请选择日期",
	        "width":"200px",
	        "isIconTrigger":true,
	        "hasClearBtn":true,
	        "hasTodayBtn":true,
	        "hasConfirmBtn":false,
	        "locale":"zh_CN",
	        "noCurrent":false,
	        "id":"actualStopTime1"
	    }
	}
	
    $(document).ready(function(){
        cap.pageInit();
    });
