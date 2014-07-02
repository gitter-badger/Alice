define(function (require, exports, module) {

    var PanelView   = require("src/panelView"),
        i18n        = require("src/i18n").i18n;
        filters     = require("src/utils").filters
        panelHTML   = require("text!templates/panels/init.html");

    var panelButtons = {
        BTN_SHOW_BUGS   : "nullpo-alice-btn-bugs",
        BTN_SHOW_OPENED : "nullpo-alice-btn-open",
        BTN_SHOW_CLOSED : "nullpo-alice-btn-closed",
        BTN_SHOW_ALL    : "nullpo-alice-btn-all"
    }

    var Panel = function(model){
        var self = this;
        var bugsOpened = filters.operators.UNION(filters.issues.bugs,filters.issues.opened)
        var issuesOpened = filters.issues.opened;
        var issuesClosed = filters.issues.closed;
        var allIssues = filters.issues.all;

        self.html = panelHTML;
        self.contentManager = undefined;
        self.model = model;

        model.onSuccessRequest(function(){
            $(".alice-background-logo").removeClass("busy");
            return true;
        });

        model.onStartRequest(function(){
            $(".alice-background-logo").addClass("busy");
            return true;
        });


        self._filter = function(button,title,state){
            return function(){
                var issuesHTML = $("#bottom-alice-issues-tpl").html(),
                    rendered,
                    issuesToShow,
                    $buttonsGroup;

                $("#title-alice").html(title);
                Mustache.parse(issuesHTML);
                issuesToShow = self.model.data.issues.filter(state);
                rendered = Mustache.render(issuesHTML,{issues:issuesToShow});
                $("#bottom-alice-issues > .alice-bottom-content").html(rendered);

                $buttonsGroup = $("#alice-select-issuetype input[type=button]");
                $buttonsGroup.removeAttr('disabled');
                $buttonsGroup.addClass("btn");
                $buttonsGroup.removeClass("btn-warning btn-primary");

                $("#"+button).addClass("btn-primary");
                $("#"+button).removeClass("btn-warning btn");

                $(".alice-get-details").click(function(evt){
                    var $this = $(this);
                    self.contentManager.changeTo("detailIssue",$this.data("number"));
                    //self.views.issueFilter.buttons.show.evt($this.data("number"))
                })
            }
        }

        self._setRepository = function(){
            var $txtRawUrl = $("#alice-url"),
                issuesHTML = $("#bottom-alice-issues-tpl").html(),
                isSettingTheRepository = false,
                $buttonsGroup,
                afterSetingRepository = function(){
                    self._issueEvents.showAll.evt();
                };

            isSettingTheRepository = self.model.setGithubRepository(
                $txtRawUrl.val(),
                afterSetingRepository
            );

            if(!isSettingTheRepository){
                $(".alice-control-group-repo-url").removeClass("success")
                $(".alice-control-group-repo-url").addClass("error")
                return false;
            } else {
                $("#title-alice").html(i18n.LBL_LOADING);
                $(".alice-control-group-repo-url").removeClass("success")
                $(".alice-control-group-repo-url").addClass("success")
                $(".alice-control-group-repo-url input").removeAttr("disabled")

                $("#bottom-alice-issues > .alice-bottom-content").html(i18n.LBL_LOADING);

                $buttonsGroup = $("#alice-select-issuetype input[type=button]");
                $buttonsGroup.removeAttr('disabled');
                $buttonsGroup.addClass("btn");
                $buttonsGroup.removeClass("btn-warning btn-primary");

                $("#nullpo-alice-btn-refresh").removeAttr("disabled");
                return true;
            }
        }

        self._issueEvents = {
            showBugs: {
                id: panelButtons.BTN_SHOW_BUGS,
                evt: self._filter(panelButtons.BTN_SHOW_BUGS,i18n.BTN_ISSUES_BUGS, bugsOpened)
            },
            showOpen: {
                id: panelButtons.BTN_SHOW_OPENED,
                evt: self._filter(panelButtons.BTN_SHOW_OPENED,i18n.BTN_ISSUES_OPEN, issuesOpened)
            },
            showClosed: {
                id: panelButtons.BTN_SHOW_CLOSED,
                evt: self._filter(panelButtons.BTN_SHOW_CLOSED,i18n.BTN_ISSUES_CLOSE, issuesClosed)
            },
            showAll: {
                id: panelButtons.BTN_SHOW_ALL,
                evt: self._filter(panelButtons.BTN_SHOW_ALL,i18n.BTN_ISSUES_ALL, allIssues)
            }
        }

        self.show = function($panel){
            var $btnSaveUrl = $("#nullpo-alice-saveurl");
            $panel.find(".close").click(function(){
                self.contentManager.toggle();
            });

            var buttons = self._issueEvents;

            for(var button in buttons){
                $("#"+ buttons[button].id).click(buttons[button].evt);
            }

            $btnSaveUrl.click(function(){
                $("#alice-url").val($("#alice-url-firsttime").val());
                $("#nullpo-alice-btn-refresh").click(
                    function(){
                        self._setRepository()
                    }
                );
                if(self._setRepository())
                    $(".alice-background-logo").addClass("more-transparent");
            });

            var saveOnEnter = function(e){
                if (e.keyCode == 13) {
                    $btnSaveUrl.click();
                }
            };

            var refreshOnEnter = function(e){
                if (e.keyCode == 13) {
                    $("#nullpo-alice-btn-refresh").click();
                }
            };

            $("#alice-url-firsttime").keydown(saveOnEnter);
            $("#alice-url").keydown(refreshOnEnter);
        }

        self.beforeHide = function(){
            return true;
        }

        return self;
    }

    exports.create = function(props){
        return new Panel(props);
    }

});
