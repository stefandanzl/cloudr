package bootstrap

import (
	"fmt"

	"github.com/stefandanzl/cloudr/pkg/conf"
)

// InitApplication 初始化应用常量
func InitApplication() {
	fmt.Print(`
             ___ _                 _                
            / __\ | ___  _   _  __| |_ __           
           / /  | |/ _ \| | | |/ _  | '__|          
          / /___| | (_) | |_| | (_| | |             
          \____/|_|\___/ \__,_|\__,_|_|             

   V` + conf.BackendVersion + `  Commit #` + conf.LastCommit + `  Pro=` + conf.IsPro + `
================================================

`)
	//go CheckUpdate()
}
