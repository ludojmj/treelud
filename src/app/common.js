angular.module( 'treelud.common', [

])

.factory( 'ConfigFactory', function ( $resource ) {
    // Call json config file
    return $resource(
        'assets/config.json'
    );
})

.factory( 'WebApiFactory', function ( $resource ) {
    // Call Web Api resource
    return $resource(
        '/api'
    );
})

.factory( 'MessageFactory', function ( $timeout, MsgTypeEnum ) {
    // Handle messages: info, success, error
    var result = {
        'msgList': {},
        'setMsg': function ( text, type ) {
            var timestamp = (new Date()).getTime();
            var delay = type === MsgTypeEnum.ERROR ? 10 : 20;
            result.msgList[timestamp] = {
                'info' : type === MsgTypeEnum.INFO,
                'error' : type === MsgTypeEnum.ERROR,
                'success' : type === MsgTypeEnum.SUCCESS,
                'text' : text===null?'Cannot reach web server.':text,
                'closex': function () {
                    delete result.msgList[timestamp];
                    // close();
                }
            };
            $timeout(function () {
                delete result.msgList[timestamp];
            }, delay * 1000);
        },
        'setWaitingMsg': function ( text, idx ) {
            if (text === '') {
                delete result.msgList[idx];
                return;
            }
            result.msgList[idx] = {
                'info' : true,
                'error' : false,
                'success' : false,
                'text' : text
            };
        }
    };
    return result;
})

.factory( 'MsgTypeEnum', function () {
    // Types of notifications
    return {
        'INFO' : 'info',
        'ERROR' : 'error',
        'SUCCESS' : 'success'
    };
})

.filter( 'basename', function() {
    // Retrieve file name or last directory name from full path
    return function( path, islocal, scope ) {
        var result = path;
        if ( islocal && result == scope.localTree[0].path || !islocal && result == scope.remoteTree[0].path) {
            return result;
        }
        result = path.replace(/\\/g,'/').replace( /.*\//, '' );
        return result;
    };
})

;
