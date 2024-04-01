#!/usr/bin/env python
# -*- coding:utf-8 -*-
# *********************************************************#
# @@ScriptName: log.py
# @@Author: 张砚程
# @@Create Date: 2021-03-25 22:24:14
# @@Modify Date: 2012-93-25 22:24:34
# @@Description: 日志模块
# @@Copyright © 91duobaoyu, Inc. All rights reserved.
# *********************************************************#

import os
import logging
import time
import colorlog

class Log(object):
    def __init__(self):
        self.now = time.strftime("%Y-%m-%d--%H-%M")

    def __printconsole(self, level, message):
        # 创建一个logger
        log_colors_config = {
            'DEBUG': 'bold_cyan',  # cyan white
            'INFO': 'green',
            'WARNING': 'bold_yellow',
            'ERROR': 'bold_red',
            'CRITICAL': 'red',
        }

        logger = logging.getLogger('logger_name')

        # 输出到控制台
        console_handler = logging.StreamHandler()
        # 输出到文件

        # 日志级别，logger 和 handler以最高级别为准，不同handler之间可以不一样，不相互影响
        logger.setLevel(logging.DEBUG)
        console_handler.setLevel(logging.DEBUG)

        console_formatter = colorlog.ColoredFormatter(
            fmt='%(log_color)s[%(asctime)s.%(msecs)03d] -> [%(levelname)s] : %(message)s',
            datefmt='%Y-%m-%d  %H:%M:%S',
            log_colors=log_colors_config
        )
        console_handler.setFormatter(console_formatter)
        if not logger.handlers:
            logger.addHandler(console_handler)

        console_handler.close()

        # 记录一条日志
        if level == 'info':
            # if len(message) > 500:
            #     message = message[:500] + '...'
            logger.info(message)
        elif level == 'debug':
            logger.debug(message)
        elif level == 'warning':
            logger.warning(message)
        elif level == 'error':
            logger.error(message)

    def debug(self, message):
        self.__printconsole('debug', message)

    def info(self, message):
        self.__printconsole('info', message)

    def warning(self, message):
        self.__printconsole('warning', message)

    def error(self, message):
        self.__printconsole('error', message)

if __name__ == "__main__":
    Log().debug('debug')
    Log().info('info')
    Log().warning('warning')
    Log().error('error')