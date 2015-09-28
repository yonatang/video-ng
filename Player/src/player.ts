/// <reference path="../typings/tsd.d.ts" />
module PlayerData {
    export class Video {
        url:string;
        items:Array<Item>;
        context:Object = {};

        getActiveItems(timestamp:number):Array<Item> {
            var result = new Array<Item>();
            //Can do way smarter lookup here - sort items by time and do binary search for instance.
            this.items.forEach((item)=> {
                if (timestamp >= item.startTime && timestamp <= item.stopTime) {
                    //trivial. Need to have something more sophisticated to decide whether the item is active or not
                    result.push(item);
                }
            });

            return result;
        }
    }

    export function loadFromDTO(dtoVideo:DTO.Video):Video {
        var video = new Video();
        video.url = dtoVideo.url;
        video.items = [];
        //TODO smarter item reading here
        dtoVideo.items && dtoVideo.items.forEach((itm)=> {
            var item;
            switch (itm.itemType) {
                case ItemType[ItemType.TEXT]:
                    item = new TextItem(itm.startTime, itm.stopTime, itm.payload);
                    break;
            }
            if (item) {
                video.items.push(item);
            }
            //console.log('itm ' + itm);
            //console.log('itm ' + itm.itemType);
        });
        return video;
    }


    export class Item {
        conditions:Array<Condition>;

        constructor(public itemType:ItemType, public startTime:number, public stopTime:number) {
        }

        toString():string {
            return ItemType[this.itemType] + ", Starting " + this.startTime.toFixed(2) + " Ending " + this.stopTime.toFixed(2);
        }
    }

    class TextItem extends Item {
        //itemType = ;
        text:string;
        conditions = new Array<Condition>();

        constructor(startTime:number, stopTime:number, payload:any) {
            super(ItemType.TEXT, startTime, stopTime);
            this.text = <string>payload;
        }

        toString():string {
            return super.toString() + ", Text: " + this.text;
        }
    }

    export interface Condition {
        canApply(timestamp:number, ctx:Object) :boolean;
    }
}

//BUTTONS
// video buttons,
// contextual buttons

enum ItemType { VIDEO_BUTTON, TEXT, SOUND  }

module DTO {
    export class Video {
        url:string;
        items:Array<Item>;
    }
    export function loadFromJson(json:string):Video {
        var video = new Video();
        $.extend(video, JSON.parse(json));
        return video;
    }

    export class Item {
        itemType:string;
        startTime:number;
        stopTime:number;
        payload:any;
    }
}

module Core {
    export class Player {
        private video:PlayerData.Video;
        private videoElem:HTMLVideoElement;

        getVideoTime():number {
            return this.videoElem.currentTime;
        }

        play():void {
            this.videoElem.play();
        }

        load(dtoVideo:DTO.Video) {
            this.video = PlayerData.loadFromDTO(dtoVideo);
            console.log("video object", this.video);
            console.log("Loading video from", this.video.url);
            var sourcePane = $("<source>").attr("src", this.video.url);
            this.videoPane.empty();
            this.videoPane.append(sourcePane);
            this.videoElem.load();
        }

        timeUpdateListener(event:any):void {
            var timestamp = this.getVideoTime();
            var activeItems = this.video.getActiveItems(timestamp);
            var loggedText = [];
            activeItems.forEach((item)=> {
                var logItem = $("<li>");
                logItem.text("Item: " + item.toString());
                loggedText.push(logItem);
            });
            if (loggedText.length > 0) {
                var logEntry = $("<div>");
                logEntry.text(timestamp.toFixed(2) + " - " + loggedText.length + " entries:");
                loggedText.forEach((item)=>logEntry.append(item));
                this.logPane.prepend(logEntry);
            }

        }

        constructor(private videoPane:JQuery, private logPane:JQuery) {
            this.videoElem = <HTMLVideoElement>this.videoPane.get(0);
            this.videoPane.on("timeupdate", (event)=> {
                this.timeUpdateListener(event)
            });
        }
    }
}


$(function () {
    //var videoDto = new DTO.Video();
    //videoDto.url = "http://techslides.com/demos/sample-videos/small.mp4";
    //var player = new Core.Player(videoDto);
    //player.play();

    var player = new Core.Player($("#videoPane"), $("#logPane"));

    var inputJson = $("#inputJson");
    $("#saveJson").click(()=> {
        try {
            var videoDto = DTO.loadFromJson(inputJson.val());
            console.log("video DTO", videoDto);
        } catch (e) {
            alert("Provided string is not a valid json");
            return;
        }
        player.load(videoDto);
        player.play();
        $("#loadModal").modal("hide");
    });

});
//document.body.innerHTML = greeter(user);