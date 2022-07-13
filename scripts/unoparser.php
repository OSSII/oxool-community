#!/usr/bin/php
<?php
function xml2array( $file )
{
    $parser = xml_parser_create();
    xml_parser_set_option( $parser, XML_OPTION_CASE_FOLDING, 0 );
    xml_parser_set_option( $parser, XML_OPTION_SKIP_WHITE, 1 );
    xml_parse_into_struct( $parser, file_get_contents($file), $tags );
    xml_parser_free( $parser );

    $elements = array();
    $stack = array();
    foreach ( $tags as $tag )
    {
        $index = count( $elements );
        if ( $tag['type'] == "complete" || $tag['type'] == "open" )
        {
            $elements[$index] = array();
            $elements[$index]['name'] = $tag['tag'];
	    if (isset($tag['attributes']))
            	$elements[$index]['attributes'] = $tag['attributes'];
	    if (isset($tag['value']))
            	$elements[$index]['content'] = $tag['value'];

            if ( $tag['type'] == "open" )
            {    # push
                $elements[$index]['children'] = array();
                $stack[count($stack)] = &$elements;
                $elements = &$elements[$index]['children'];
            }
        }

        if ( $tag['type'] == "close" )
        {    # pop
            $elements = &$stack[count($stack) - 1];
            unset($stack[count($stack) - 1]);
        }
    }
    return $elements[0];
}

function array2node($xmlArray)
{
    foreach($xmlArray as $data)
    {
        if (gettype($data) == 'array')
        {
            if (isset($data['oor:package'])) continue; // 跳過表頭

            $nodes = array();
            _2nodes($data, $nodes, '');
	        return $nodes;
        }
    }
}

function _2nodes($array, &$nodes, $uno)
{
    foreach ($array as $node)
    {
        if (isset($node['name']) && isset($node['attributes']) && isset($node['children']))
        {
            $nodeName = $node['name'];
            $nodeAttrName = $node['attributes']['oor:name'];
            $nodeChildren = $node['children'];
            switch ($nodeName)
            {
                case 'node':
                    $uno = $nodeAttrName;
                    $nodes[$uno] = array();
                    break;
                case 'prop':
                    switch ($nodeAttrName)
                    {
                        case 'Label':   //
                        case 'ContextLabel':    //
                        case 'TooltipLabel':    //
                        case 'PopupLabel':  //
                        case 'TargetURL':
                        case 'IsExperimental':
                        case 'Properties': // 是否顯示 icon
                            if (!isset($nodeChildren[0]['content']))
                                $nodeChildren[0]['content'] = '';

                            $nodes[$uno][$nodeAttrName] = $nodeChildren[0]['content'];
                            break;
                        default:
                            echo "other prop attrib name : ".$nodeAttrName."\n";
                            break;
                    }
                    break;
                default:
                    echo $nodeName."\n";
                    break;
            }
            _2nodes($node['children'], $nodes, $uno);
        }
    }
}

/**
 *
 * @param unknown_type $args
 */
function buildOptions($args)
{
    $options = array(
        '-i'    => null,
        '-o'    => null
    );
    $len = count($args);
    $i = 0;
    while ($i < $len)
    {
        if (preg_match('#^-[a-z]$#i', $args[$i]))
        {
            $options[$args[$i]] = isset($args[$i+1]) ? trim($args[$i+1]) : true;
            $i += 2;
        }
        else {
            $options[] = $args[$i];
            $i++;
        }
    }
    return $options;
}

/*
*
*
*
*/
$options = buildOptions($argv);

if (!is_dir($options['-i']) || !is_dir($options['-o']))
{
    die("usage: {program} -i /path/to/libreoffice_source_path -o /path/to/online_source_path");
}

$loSourcePath = $options['-i']; // LibreOffice Source code 路徑
$oxoolSourcePath = $options['-o']; // OxOOL Source code 路徑

// UI 相對路徑
$commandPath = '/officecfg/registry/data/org/openoffice/Office/UI';
// locale 相對路徑
$localePath = '/translations/source';
// 命令列表
$unoCcommandFiles = array(
		'global' => array('file' => 'GenericCommands.xcu', 'nodes' => array()), // 通用命令
		'text' => array('file' => 'WriterCommands.xcu', 'nodes' => array()), // Write
		'spreadsheet' => array( 'file' => 'CalcCommands.xcu', 'nodes' => array()), // Calc
		'presentation' => array('file' => 'DrawImpressCommands.xcu', 'nodes' => array()), // Draw & Impress
		'chart' => array('file' => 'ChartCommands.xcu', 'nodes' => array()) // Chart
        );

$unoCommandsArray = array();

foreach ($unoCcommandFiles as $xcu => $data)
{
    $xcuFile = $loSourcePath.$commandPath.'/'.$data['file'];
    if (file_exists($xcuFile))
    {
        // 先把 xml 檔案解成 array
	    $xml = xml2array($xcuFile);
	    // 再把 array 轉成 nodes
        $nodes = array2node($xml);
	    foreach ($nodes as $cmd => $data)
	    {
		if (substr($cmd, 0, 5) == '.uno:')
            		$uno = substr($cmd, 5);
		else
			$uno = $cmd;

	        if (!isset($unoCommandsArray[$uno]))
	        {
		        $unoCommandsArray[$uno] = array();
	        }

	        $unoCommandsArray[$uno][$xcu] = array();
	        foreach ($data as $key => $value)
	        {
		        switch ($key)
		        {
		            case 'Label':
			            $unoCommandsArray[$uno][$xcu]['menu'] = $value;
			            break;
			        case 'ContextLabel':
			            $unoCommandsArray[$uno][$xcu]['context'] = $value;
			            break;
                    case 'TooltipLabel':
			            $unoCommandsArray[$uno][$xcu]['tooltip'] = $value;
			            break;
	                case 'PopupLabel':
			            $unoCommandsArray[$uno][$xcu]['popup'] = $value;
			            break;
        	        case 'TargetURL':
			            $unoCommandsArray[$uno][$xcu]['TargetURL'] = $value;
			            break;
        	        case 'Properties':
			            $unoCommandsArray[$uno][$xcu]['properties'] = $value;
			            break;
                    case 'IsExperimental':
			            $unoCommandsArray[$uno][$xcu]['IsExperimental'] = $value;
			            break;
		        }
	        }
	    }
    }
    else
    {
        echo 'ERROR : '.$xcuFile." not found!\n";
        exit(255);
    }
}

$unojs = $oxoolSourcePath . '/loleaflet/src/unocommands.js';
ksort($unoCommandsArray);
$json = 'var unoCommandsArray = ' . json_encode($unoCommandsArray, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).';';

$jsContent = <<< EOD
// Don't modify, generated using unoparser.php

${json}

window._UNO = function(string, component, isContext) {
	var command = (string.startsWith('.uno:') ? string.substr(5) : string);
	var entry = unoCommandsArray[command]; // 取得該指令資料

	// 找不到 uno command 就直接傳回該指令
	if (entry === undefined) {
		return command;
	}

	// 取得文件類別(text, spreadsheet, presentation)
	var componentEntry = entry[component];
	// 指令資料不含指定的文件類別
	if (componentEntry === undefined) {
		// 取 global 紀錄
		componentEntry = entry['global'];
		// 連 global 也沒有，就直接傳回指令名稱
		if (componentEntry === undefined) {
            // 找第一個找到的文件類別
			for (component in entry) {
            }
            componentEntry = entry[component];
        }
	}

	var priority = isContext === true ? ['context', 'menu'] : ['menu', 'context'];
	var text = undefined;
	for (var i = 0 ; text === undefined && i < priority.length ; i++) {
		text = componentEntry[priority[i]];
	}

	if (text === undefined ) return command;

	return this.removeAccessKey(_(text) );
}

window._UNOTARGET = function(string, component) {
    var command = (string.startsWith('.uno:') ? string.substr(5) : string);
    var entry = unoCommandsArray[command];
    if (entry === undefined) {
        return '';
    }

    var componentEntry = entry[component];
    if (componentEntry === undefined) {
		return '';
    }

    var  targetURL = componentEntry['TargetURL']
    return (targetURL === undefined ? '' : targetURL);
}

window._UNOICON = function(string, component) {
    var command = (string.startsWith('.uno:') ? string.substr(5) : string);
    var fallback = "global";

    var entry = unoCommandsArray[command];
    if (entry === undefined) {
        return '';
    }

    var componentEntry = entry[component];
    if (componentEntry === undefined) {
	    componentEntry = entry[fallback];
	    if (componentEntry === undefined) {
            return '';
        }
    }

    return command.toLowerCase();
}

window.removeAccessKey = function(text) {
    // Remove access key markers from translated strings
	// 1. access key in parenthesis in case of non-latin scripts
	text = text.replace(/\(~[A-Za-z]\)/, '');
	// 2. remove normal access key
	text = text.replace('~', '');

	return text;
}
EOD;

file_put_contents($unojs, $jsContent);  // 存新的 unocommands.js

// 掃描 LiibreOffice uno po 檔路徑
if ($handle = opendir($loSourcePath.$localePath))
{
    $po2json = dirname($argv[0]).'/po2json.php'; // po2json.php 路徑
    $targetPath = $oxoolSourcePath.'/loleaflet/l10n/uno';
    while (false !== ($entry = readdir($handle)))
    {
        if ($entry != "." && $entry != "..")
        {
            $locale = $entry;
            $jsonName = $locale.'.json';
            $UIpo = $loSourcePath.$localePath.'/'.$locale.$commandPath.'.po';
            if (is_file($UIpo))
            {
                $output = array();
                $retuenVar = 0;
                $cmd = sprintf("%s -i %s -o %s", $po2json, $UIpo, $targetPath.'/'.$jsonName);
                echo "Convert " . $locale . '... ';
                exec($cmd, $output, $retuenVar);
                echo ($retuenVar == 0 ? "OK" : "Fail")."\n";
            }
        }
    }
    closedir($handle);
}
?>
