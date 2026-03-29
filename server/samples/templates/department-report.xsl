<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">
  
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>
  
  <!-- Root template -->
  <xsl:template match="/Report">
    <fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
      <!-- Define page layout -->
      <fo:layout-master-set>
        <fo:simple-page-master master-name="dept-page" page-height="11in" page-width="8.5in"
                               margin-top="0.45in" margin-bottom="0.5in" 
                               margin-left="0.45in" margin-right="0.45in">
          <fo:region-body margin-top="0.85in" margin-bottom="0.6in"/>
          <fo:region-before extent="0.75in" region-name="xsl-region-before"/>
          <fo:region-after extent="0.5in" region-name="xsl-region-after"/>
        </fo:simple-page-master>
      </fo:layout-master-set>
      
      <!-- Process each department -->
      <xsl:for-each select="Department">
        <xsl:variable name="dept-id" select="generate-id()"/>
        <fo:page-sequence master-reference="dept-page" initial-page-number="1">
          <fo:static-content flow-name="xsl-region-before">
            <fo:block font-size="14pt" font-weight="bold">
              Department: <xsl:value-of select="@name"/>
            </fo:block>
            <fo:block font-size="12pt" text-align="right">
              Page <fo:page-number/> of <fo:page-number-citation ref-id="{$dept-id}-last"/>
            </fo:block>
          </fo:static-content>
          
          <fo:flow flow-name="xsl-region-body">
            <xsl:for-each select="Item">
              <fo:block margin-bottom="0.5cm">
                <xsl:value-of select="."/>
              </fo:block>
            </xsl:for-each>
            
            <fo:block id="{$dept-id}-last" text-align="center" font-size="16pt" font-weight="bold" margin-top="2cm">
              End of <xsl:value-of select="@name"/>
            </fo:block>
          </fo:flow>
        </fo:page-sequence>
      </xsl:for-each>
    </fo:root>
  </xsl:template>
  
</xsl:stylesheet>